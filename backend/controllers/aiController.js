const DietPlan = require('../models/DietPlan');

const calcAge = (dob) => {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? age : null;
};

const buildRuleBasedPlan = ({ name, age, gender, heightCm, weightKg, goal, activityLevel, dietType, allergies, notes }) => {
  const cleanWeight = Number(weightKg) || 70;
  const cleanAge = Number(age) || 25;
  const cleanHeight = Number(heightCm) || 170;
  const cleanGender = (gender || 'other').toLowerCase();
  const cleanGoal = (goal || 'maintenance').toLowerCase();
  const cleanActivity = (activityLevel || 'moderate').toLowerCase();
  const cleanDiet = (dietType || 'balanced').toLowerCase();

  const activityMultiplier = {
    low: 1.25,
    moderate: 1.4,
    high: 1.6,
  }[cleanActivity] || 1.4;

  // Baseline energy estimate using Mifflin-St Jeor style constants.
  const bmrBase = (10 * cleanWeight) + (6.25 * cleanHeight) - (5 * cleanAge);
  const genderAdjustment = cleanGender === 'male' ? 5 : cleanGender === 'female' ? -161 : -78;
  const maintenanceCalories = Math.round((bmrBase + genderAdjustment) * activityMultiplier);

  let targetCalories = maintenanceCalories;
  if (cleanGoal === 'weight_loss') targetCalories = Math.max(1200, maintenanceCalories - 400);
  if (cleanGoal === 'muscle_gain') targetCalories = maintenanceCalories + 300;

  const macroRatios = {
    keto: { carbs: 0.1, protein: 0.35, fats: 0.55 },
    high_protein: { carbs: 0.3, protein: 0.4, fats: 0.3 },
    vegetarian: { carbs: 0.45, protein: 0.3, fats: 0.25 },
    balanced: { carbs: 0.4, protein: 0.3, fats: 0.3 },
  }[cleanDiet] || { carbs: 0.4, protein: 0.3, fats: 0.3 };

  const carbsG = Math.round((targetCalories * macroRatios.carbs) / 4);
  const proteinG = Math.round((targetCalories * macroRatios.protein) / 4);
  const fatsG = Math.round((targetCalories * macroRatios.fats) / 9);

  const mealSet = cleanDiet === 'vegetarian'
    ? [
        'Breakfast: Tofu scramble 120 g + oats 60 g + berries 80 g',
        'Lunch: Cooked quinoa 180 g + chickpeas 120 g + mixed vegetables 150 g + olive oil 10 g',
        'Snack: Mixed nuts 30 g + apple 150 g + unsweetened tea 250 ml',
        'Dinner: Lentil curry 250 g + cooked brown rice 150 g + cucumber salad 120 g',
      ]
    : cleanDiet === 'keto'
      ? [
          'Breakfast: Whole eggs 150 g + avocado 100 g + sauteed spinach 80 g',
          'Lunch: Grilled chicken 180 g + mixed salad vegetables 160 g + olive oil 12 g + seeds 15 g',
          'Snack: Cheese cubes 50 g + almonds 20 g',
          'Dinner: Baked salmon 180 g + roasted vegetables 200 g',
        ]
      : [
          'Breakfast: Oats 70 g + whey 30 g + banana 120 g',
          'Lunch: Grilled protein 170 g + cooked whole grains 160 g + mixed vegetables 150 g',
          'Snack: Protein shake 350 ml + mixed nuts 25 g',
          'Dinner: Lean protein 160 g + salad 140 g + sweet potato 180 g',
        ];

  const noteLine = notes ? `- Notes considered: ${notes}` : '- Notes considered: None';
  const allergyLine = allergies ? `- Allergies to avoid: ${allergies}` : '- Allergies to avoid: None reported';

  return [
    `Diet Plan for ${name || 'Member'}`,
    '',
    'Targets',
    `- Daily calories: ${targetCalories} kcal`,
    `- Carbs: ${carbsG} g`,
    `- Protein: ${proteinG} g`,
    `- Fats: ${fatsG} g`,
    '',
    'Meal Structure',
    ...mealSet.map((meal) => `- ${meal}`),
    '',
    'Hydration and Recovery',
    '- Water: 2.5 to 3.5 liters daily',
    '- Sleep target: 7 to 8 hours nightly',
    '- Activity: 7,000 to 10,000 steps daily on non-training days',
    '',
    'Customization Notes',
    allergyLine,
    noteLine,
    '',
    'This plan is educational guidance and not a medical prescription. Consult a licensed dietitian for clinical conditions.',
  ].join('\n');
};

const callOpenAI = async (prompt) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: 'You are a fitness nutrition assistant. Generate practical, safe, concise diet plans with calories, macros, meal timing, and hydration tips. Avoid medical diagnosis.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI request failed: ${details}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
};

exports.generateDietPlan = async (req, res) => {
  try {
    const { name, age, gender, heightCm, weightKg, goal, activityLevel, dietType, allergies, notes } = req.body;

    if (!age || !heightCm || !weightKg || !goal || !activityLevel) {
      return res.status(400).json({ message: 'Please provide age, height, weight, goal, and activity level.' });
    }

    const prompt = [
      'Create a personalized 7-day diet plan with clear headings and bullet points.',
      `Name: ${name || req.user?.name || 'Member'}`,
      `Age: ${age}`,
      `Gender: ${gender || 'Not specified'}`,
      `Height (cm): ${heightCm}`,
      `Weight (kg): ${weightKg}`,
      `Goal: ${goal}`,
      `Activity Level: ${activityLevel}`,
      `Diet Type: ${dietType || 'balanced'}`,
      `Allergies: ${allergies || 'None'}`,
      `Additional Notes: ${notes || 'None'}`,
      'Include: calorie target, macro target, meal examples, hydration, and a brief safety note.',
      'For each meal, include exact ingredient quantities in grams (g). Use ml only for liquids.',
      'Output format requirement: Breakfast, Lunch, Snack, Dinner with measurable quantities for each item.',
    ].join('\n');

    let planText;
    let source = 'rule-based';

    try {
      const aiOutput = await callOpenAI(prompt);
      if (aiOutput) {
        planText = aiOutput;
        source = 'openai';
      }
    } catch (error) {
      console.error('OpenAI fallback triggered:', error.message);
    }

    if (!planText) {
      planText = buildRuleBasedPlan({ name, age, gender, heightCm, weightKg, goal, activityLevel, dietType, allergies, notes });
    }

    const userModelByRole = {
      user: 'User',
      trainer: 'Trainer',
      admin: 'Admin',
    };

    const savedPlan = await DietPlan.create({
      userId: req.user._id,
      userModel: userModelByRole[req.user.role] || 'User',
      userName: req.user.name || name || 'Member',
      userRole: req.user.role,
      source,
      input: {
        age: Number(age),
        gender,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        goal,
        activityLevel,
        dietType,
        allergies,
        notes,
      },
      plan: planText,
    });

    res.json({
      source,
      plan: planText,
      planId: savedPlan._id,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate diet plan' });
  }
};

const buildPrompt = (displayName, { age, gender, heightCm, weightKg, goal, activityLevel, dietType, allergies, notes }) => [
  'Create a personalised 7-day diet plan with clear headings and bullet points.',
  `Name: ${displayName}`,
  `Age: ${age}`,
  `Gender: ${gender || 'Not specified'}`,
  `Height (cm): ${heightCm}`,
  `Weight (kg): ${weightKg}`,
  `Goal: ${goal}`,
  `Activity Level: ${activityLevel}`,
  `Diet Type: ${dietType || 'balanced'}`,
  `Allergies: ${allergies || 'None'}`,
  `Additional Notes: ${notes || 'None'}`,
  'Include: calorie target, macro target, meal examples, hydration, and a brief safety note.',
  'For each meal, include exact ingredient quantities in grams (g). Use ml only for liquids.',
].join('\n');

// Step 1 — generate only, no DB save (trainer previews before sending)
exports.trainerPreviewDietPlan = async (req, res) => {
  try {
    const { memberName, name, dateOfBirth, age, gender, heightCm, weightKg, goal, activityLevel, dietType, allergies, notes } = req.body;
    const resolvedAge = calcAge(dateOfBirth) || Number(age);
    if (!resolvedAge || !heightCm || !weightKg || !goal || !activityLevel) {
      return res.status(400).json({ message: 'Please provide date of birth (or age), height, weight, goal, and activity level.' });
    }
    const displayName = memberName || name || 'Member';
    const bodyWithAge = { ...req.body, age: resolvedAge };
    let planText;
    let source = 'rule-based';
    try {
      const aiOutput = await callOpenAI(buildPrompt(displayName, bodyWithAge));
      if (aiOutput) { planText = aiOutput; source = 'openai'; }
    } catch (e) { console.error('OpenAI fallback:', e.message); }
    if (!planText) planText = buildRuleBasedPlan({ name: displayName, ...bodyWithAge });
    res.json({ source, plan: planText });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate diet plan preview' });
  }
};

// Step 2 — save the already-previewed plan to DB (auto-approved)
exports.trainerSendDietPlan = async (req, res) => {
  try {
    const { memberId, memberName, name, dateOfBirth, age, gender, heightCm, weightKg, goal, activityLevel, dietType, allergies, notes, planText, source } = req.body;
    const resolvedAge = calcAge(dateOfBirth) || Number(age);
    if (!memberId) return res.status(400).json({ message: 'memberId is required' });
    if (!planText) return res.status(400).json({ message: 'planText is required' });
    const displayName = memberName || name || 'Member';
    const savedPlan = await DietPlan.create({
      userId: memberId,
      userModel: 'User',
      userName: displayName,
      userRole: 'user',
      source: source || 'rule-based',
      status: 'approved',
      trainerComment: 'Diet plan generated and approved by your trainer.',
      reviewedBy: req.user._id,
      reviewedByName: req.user.name || 'Trainer',
      reviewedAt: new Date(),
      input: { age: resolvedAge, dateOfBirth, gender, heightCm: Number(heightCm), weightKg: Number(weightKg), goal, activityLevel, dietType, allergies, notes },
      plan: planText,
    });
    res.status(201).json({ planId: savedPlan._id, generatedAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send diet plan to member' });
  }
};
