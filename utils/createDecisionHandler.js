exports.createDecisionHandler = async (model, commonFields, details) => {
  const newDecision = await new model({
    ...commonFields,
    details,
  });
  try {
    await newDecision.save();
    return { status: true, newDecision };
  } catch (error) {
    return { status: false, error };
  }
};
