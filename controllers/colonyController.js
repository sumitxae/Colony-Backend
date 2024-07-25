const colonyModel = require("../models/colony");
const userModel = require("../models/user");
const { catchAsyncError } = require("../middlewares/catchAsyncErrors");
const teamModel = require("../models/team");
const ErrorHandler = require("../utils/errorHandler");
const decisionModel = require("../models/decision");
const promoterDecision = require("../models/schemas/promotion");
const mintDecision = require("../models/schemas/mintToken");
const paymentDecision = require("../models/schemas/expenditure");
const { createDecisionHandler } = require("../utils/createDecisionHandler");

const addColony = catchAsyncError(async (req, res, next) => {
  const team = await teamModel.create(req.body);
  const colony = await colonyModel.findById(req.body.colony);
  team.members.push(req.body.createdBy);
  colony.teams.push(team._id);
  await team.save();
  await colony.save();
  res.status(200).json({ team });
});

const getActiveColonyDetails = catchAsyncError(async (req, res, next) => {
  console.log(req.body.id);
  const colony = await colonyModel.findById(req.body.id).populate([
    {
      path: "rootUsers",
      select: "username email pfp",
    },
    {
      path: "watchers",
      select: "username email pfp",
    },
    {
      path: "contributors",
      select: "username email pfp",
    },
    {
      path: "teams",
    },
  ]);
  if (!colony) {
    return next(new ErrorHandler("Colony Not Found", 404));
  }
  res.status(200).json(colony);
});

const sendColonyDetails = catchAsyncError(async (req, res, next) => {
  const user = await userModel.findById(req.id).populate("colonies");
  res.json(user.colonies);
});

const colonyCreator = catchAsyncError(async (req, res, next) => {
  const { colonyName, nativeToken, nativeTokenSymbol } = req.body;

  const newColony = await colonyModel.create({
    colonyName,
    nativeToken,
    nativeTokenSymbol,
    creatorId: req.id,
    rootUsers: [req.id],
    contributors: [req.id],
  });

  const user = await userModel.findById(req.id);
  user.colonies.push(newColony._id);
  user.tokens.push({
    token: newColony.nativeToken,
    symbol: nativeTokenSymbol,
    colony: newColony._id,
  });
  user.save();

  res.status(201).json({ newColony, user });
});

const joinColony = catchAsyncError(async (req, res, next) => {
  const colonyId = req.body.colonyId;
  const colony = await colonyModel.findById(colonyId);
  if (!colony) {
    return next(new ErrorHandler("Colony Not Found", 404));
  }
  const user = await userModel.findById(req.body.user);
  if (user.colonies.includes(colonyId)) {
    return next(
      new ErrorHandler("You are already a member of this colony!", 400)
    );
  }
  user.colonies.push(colonyId);

  user.tokens.push({
    token: colony.nativeToken,
    symbol: colony.nativeTokenSymbol,
    colony: colonyId,
  });

  colony.watchers.push(req.id);

  await user.save();
  await colony.save();
  res
    .status(200)
    .json({ status: true, message: "Joined Colony", user, colony });
});

const getAllDecisions = catchAsyncError(async (req, res, next) => {
  const decisions = await decisionModel.find({ colony: req.body.colonyId });
  res.status(200).json(decisions);
});

const createDecision = catchAsyncError(async (req, res, next) => {
  const votingPeriod = 1 * 60;
  const votingEndsAt = req.body?.forced
    ? Date.now()
    : new Date(Date.now() + votingPeriod);
  let status = null;
  const decisionObject = {
    title: req.body.title,
    forced: req.body.forced,
    description: req.body.desc,
    colony: req.body.colonyId,
    creator: req.body.creator,
    team: req.body?.team || null,
    votingEndsAt,
  };
  if (req.params.type === "payment") {
    const details = {
      payer: req.body.creator,
      reciever: req.body.reciever,
      amount: req.body.amount,
    };
    status = createDecisionHandler(paymentDecision, decisionObject, details);
  } else if (req.params.type === "promotion") {
    const details = {
      promoted: req.body.promoted,
      promoter: req.body.creator,
      position: req.body.position,    
    };
    status = createDecisionHandler(promoterDecision, decisionObject, details);
  } else if (req.params.type === "mint") {
    const details = {
      mintedToken: req.body.mintedToken,
      mintee: req.body.creator,
      amount: req.body.amount,
    };
    status = createDecisionHandler(mintDecision, decisionObject, details);
  }
  status
    ? res.status(201).send(status)
    : next(new ErrorHandler(status.error, 400));
});

const voteInDecision = catchAsyncError(async (req, res, next) => {
  const decisionId = req.body.decisionId;
  const decision = await decisionModel.findById(decisionId);
  if (!decision) {
    return next(new ErrorHandler("Decision Not Found", 404));
  }
  if (decision.votingEndsAt < Date.now()) {
    return next(new ErrorHandler("Voting Period Ended", 400));
  }
  const user = await userModel.findById(req.id);
  if (!user.colonies.includes(decision.colony)) {
    return next(new ErrorHandler("You are not a member of this colony!", 400));
  }
  if (decision.voters.includes(req.id)) {
    return next(
      new ErrorHandler("You have already voted in this decision!", 400)
    );
  }
  if (
    req.body.stake >
    user.tokens.find((token) => token.colony == decision.colony).token
  ) {
    return next(new ErrorHandler("Insufficient Balance", 400));
  }

  if (req.body.stake !== decision.maxStake * 0.1)
    return next(
      new ErrorHandler(
        "Cannot Stake more or less than the defined amount!",
        400
      )
    );

  user.tokens.find((token) => token.colony == decision.colony).token -=
    req.body.stake;
  await user.save();

  decision.voters.push(req.id);
  decision.votes.push({
    user: req.id,
    stake: req.body.stake,
    vote: req.body.vote,
  });
  await decision.save();
  res
    .status(200)
    .json({ status: true, message: "Voted Successfully", decision });
});

const mintTokens = catchAsyncError(async (req, res, next) => {
  const colony = await colonyModel.findById(req.body.colonyId);
  if (!colony) {
    return next(new ErrorHandler("Colony Not Found", 404));
  }
  if (!colony.rootUsers.includes(req.id)) {
    return next(
      new ErrorHandler("You are not authorized to mint tokens!", 401)
    );
  }
  colony.funds += req.body.amount;
  colony.save();
  res.status(200).json({ status: true, message: "Tokens Minted", colony });
});

const promoteUser = catchAsyncError(async (req, res, next) => {
  const colony = await colonyModel.findById(req.body.colony);

  if (!colony) return next(new ErrorHandler("Colony Not Found", 404));

  if (!colony.rootUsers.includes(req.id)) {
    return next(
      new ErrorHandler("You are not authorized to promote users!", 401)
    );
  }////////////////

  const user = await userModel.findById(req.body.promoted);

  if (!user.colonies.includes(req.body.colonyId))
    return next(new ErrorHandler("User is not a member of this colony!", 400));

  if (req.body.position === "root") colony.rootUsers.push(req.body.promoted);
  else {
    if (!colony.contributors.includes(req.body.promoted))
      colony.contributors.push(req.body.promoted);
    else return next(new ErrorHandler("User is already a contributor!", 400));
  }

  await colony.save();
  res.status(200).json({ status: true, message: "User Promoted", colony });
});

const createExpenditure = catchAsyncError(async (req, res, next) => {
  const colony = await colonyModel.findById(req.body.colony);
  const reciever = await userModel.findById(req.body.details.reciever);
  reciever.tokens.find((token) => token.colony == req.body.colony).amount +=
    req.body.details.amount;
  colony.funds -= req.body.details.amount;
  await reciever.save();
  await colony.save();
  res.status(200).json({ status: true, message: "Expenditure Successful" });
});

module.exports = {
  sendColonyDetails,
  colonyCreator,
  joinColony,
  getAllDecisions,
  createDecision,
  voteInDecision,
  mintTokens,
  addColony,
  promoteUser,
  createExpenditure,
  getActiveColonyDetails,
};
