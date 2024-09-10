const colonyModel = require("../models/colony");
const userModel = require("../models/user");
const { catchAsyncError } = require("../middlewares/catchAsyncErrors");
const teamModel = require("../models/team");
const ErrorHandler = require("../utils/errorHandler");
const decisionModel = require("../models/decision");
const reassignDecision = require("../models/schemas/reassignment");
const mintDecision = require("../models/schemas/mintToken");
const paymentDecision = require("../models/schemas/expenditure");
const { createDecisionHandler } = require("../utils/createDecisionHandler");
const decisionUpdater = require("../utils/updateDecisions");
const simpleDecision = require("../models/schemas/simpleDecision");
const { handleBunnyUploads } = require("../utils/handleBunnyUploads");

const addColony = catchAsyncError(async (req, res, next) => {
  const { colony, createdBy } = req.body;
  const team = await teamModel.create(req.body);
  const colonyDoc = await colonyModel.findById(colony);
  team.members.push(createdBy);
  colonyDoc.teams.push(team._id);
  await team.save();
  await colonyDoc.save();
  res.status(200).json({ team });
});

const getActiveColonyDetails = catchAsyncError(async (req, res, next) => {
  const { id } = req.body;
  await decisionUpdater();
  const user = await userModel.findById(req.id);
  const colony = await colonyModel.findById(id).populate([
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
  res.status(200).json({ colony, user });
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

  res.status(201).json({ colony, user });
});

const joinColony = catchAsyncError(async (req, res, next) => {
  const { colonyId, user: userId } = req.body;
  const colony = await colonyModel.findById(colonyId);
  if (!colony) {
    return next(new ErrorHandler("Colony Not Found", 404));
  }
  const user = await userModel.findById(userId);
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
  await decisionUpdater();
  const { colonyId } = req.body;
  const decisions = await decisionModel.find({ colony: colonyId }).populate([
    {
      path: "creator",
      select: "pfp",
    },
  ]);
  res.status(200).json(decisions);
});

const createDecision = catchAsyncError(async (req, res, next) => {
  const {
    type,
    title,
    forced,
    desc,
    colonyId,
    creator,
    team,
    reciever,
    amount,
    reassigned,
    assignment,
    position,
  } = req.body;
  const votingPeriod = 1 * 60;
  let fromTeam = teamModel.findById(team);
  let user = await userModel.findById(reassigned || reciever);
  const colony = await colonyModel.findById(colonyId);
  const mintedToken = colony.nativeTokenSymbol;
  const votingEndsAt = forced
    ? Date.now()
    : new Date(Date.now() + votingPeriod);
  let status = null;
  const decisionObject = {
    title: title || "",
    forced,
    description: desc,
    colony: colonyId,
    creator,
    team: team || null,
    votingEndsAt,
  };

  if (type === "transfer") {
    const toTeam = await teamModel.findById(reciever);
    decisionObject.title = `Move ${amount} ${colony.nativeTokenSymbol} from ${
      fromTeam.teamName || "Root"
    } to ${toTeam.teamName} Team`;
    const details = {
      payer: team || colonyId,
      reciever,
      amount,
    };
    status = await createDecisionHandler(
      paymentDecision,
      decisionObject,
      details
    );
  } else if (type === "payment") {
    decisionObject.title = `Pay ${user.username} ${amount} ${colony.nativeTokenSymbol}`;
    const details = {
      payer: creator,
      reciever,
      amount,
    };
    status = await createDecisionHandler(
      paymentDecision,
      decisionObject,
      details
    );
  } else if (type === "reassignment") {
    decisionObject.title = `${assignment} ${user.username} to ${position}`;
    const details = {
      reassigned,
      assignment,
      assigner: creator,
      position,
    };
    status = await createDecisionHandler(
      reassignDecision,
      decisionObject,
      details
    );
  } else if (type === "mint") {
    decisionObject.title = `Mint ${amount} ${colony.nativeTokenSymbol}`;
    const details = {
      mintedToken,
      mintee: creator,
      amount,
    };
    status = await createDecisionHandler(mintDecision, decisionObject, details);
  } else if (type === "decision") {
    const details = {
      votsInFavor: 0,
      votesAgainst: 0,
    };
    status = await createDecisionHandler(
      simpleDecision,
      decisionObject,
      details
    );
  } else if (type === "edit") {
    const details = {
      editor: creator,
      edited: team,
      
    };
    status = await createDecisionHandler(
      creator,
      decisionObject,
      details
    );
  }
  status
    ? res
        .status(201)
        .json({ status: true, message: "Decision Created", status })
    : next(new ErrorHandler("Failed to Create Decision", 500));
});

const voteInDecision = catchAsyncError(async (req, res, next) => {
  const { decisionId, stake, vote } = req.body;
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
  const userToken = user.tokens.find(
    (token) => token.colony == decision.colony
  );
  if (stake > userToken.token) {
    return next(new ErrorHandler("Insufficient Balance", 400));
  }
  if (stake !== decision.maxStake * 0.1) {
    return next(
      new ErrorHandler(
        "Cannot Stake more or less than the defined amount!",
        400
      )
    );
  }

  userToken.token -= stake;
  await user.save();

  decision.voters.push(req.id);
  decision.votes.push({
    user: req.id,
    stake,
    vote,
  });
  await decision.save();
  res
    .status(200)
    .json({ status: true, message: "Voted Successfully", decision });
});

const mintTokens = catchAsyncError(async (req, res, next) => {
  await decisionUpdater();
  const {
    colony: colonyId,
    details: { amount },
  } = req.body;
  const colony = await colonyModel.findById(colonyId);
  colony.funds += amount;
  colony.save();
  res.status(200).json({ status: true, message: "Tokens Minted", colony });
});

const promoteorDemoteUser = catchAsyncError(async (req, res, next) => {
  const {
    colony: colonyId,
    details: { reassigned, assignment, position },
  } = req.body;
  const colony = await colonyModel.findById(colonyId);

  if (assignment === "Promote") {
    if (position === "root") {
      colony.rootUsers.push(reassigned);
      if (!colony.contributors.includes(reassigned))
        colony.contributors.push(reassigned);
    } else {
      colony.contributors.push(reassigned);
    }
    colony.watchers = colony.watchers.filter(
      (watcher) => watcher._id != reassigned
    );
  } else {
    if (position === "root") {
      colony.rootUsers = colony.rootUsers.filter(
        (rootUser) => rootUser._id != reassigned
      );
    } else {
      colony.contributors = colony.contributors.filter(
        (contributor) => contributor._id != reassigned
      );
      colony.watchers.push(reassigned);
    }
  }

  await colony.save();
  res.status(200).json({ status: true, message: "User Reassigned", colony });
});

const createExpenditure = catchAsyncError(async (req, res, next) => {
  const {
    colony: colonyId,
    team: teamId,
    details: { reciever: recieverId, amount },
  } = req.body;
  const colony = await colonyModel.findById(colonyId);
  const team = await teamModel.findById(teamId);

  if (team) {
    team.funds -= amount;
    await team.save();
  } else colony.funds -= amount;

  let reciever = await userModel.findById(recieverId);
  if (reciever)
    reciever.tokens.find((token) => token.colony == colonyId).amount += amount;
  else {
    reciever = await teamModel.findById(recieverId);
    reciever.funds += amount;
  }
  await reciever.save();
  await colony.save();
  res.status(200).json({ status: true, message: "Expenditure Successful" });
});

const createNewTeam = catchAsyncError(async (req, res, next) => {
  const { colony, teamName, createdBy, description } = req.body;
  const team = await teamModel.create({
    teamName,
    description,
    createdBy,
    colony,
  });
  const colonyDoc = await colonyModel.findById(colony);
  colonyDoc.teams.push(team._id);
  await colonyDoc.save();
  const decision = await decisionModel.create({
    title: `Created ${teamName} Team`,
    colony,
    description: `Created ${teamName} Team`,
    creator: createdBy,
    team: team._id,
    status: "Passed",
  });
  res.status(201).json({ team });
});

const editTeam = catchAsyncError(async (req, res, next) => {
  const { teamId, teamName, description, colony } = req.body;
  const team = await teamModel.findById(teamId);
  if(teamName === team.teamName) return next(new ErrorHandler("Team Name Already Exists", 400));
  team.teamName = teamName || team.teamName;
  team.description = description || team.description;
  await team.save();
  const editedColony = await colonyModel.findById(colony); 
  const decision = await decisionModel.create({
    title: `Edited ${team.teamName} Team Details`,
    colony,
    description: `Edited ${team.teamName} Team Details`,
    creator: req.id,
    team: teamId,
    status: "Passed",
  });
  res.status(200).json({ team, colony: editedColony });
});

const editColonyDetails = catchAsyncError(async (req, res, next) => {
  const { colonyId, colonyName } = req.body;
  const colony = await colonyModel.findById(colonyId);
  const uploadHanlder = await handleBunnyUploads(req.file);
  colony.colonyName = colonyName || colony.colonyName;
  colony.colonyPicture = uploadHanlder || colony.colonyPicture;
  const decision = await decisionModel.create({
    title: `Created ${teamName} Team`,
    colony,
    description: `Created ${teamName} Team`,
    creator: createdBy,
    team: team._id,
    status: "Passed",
  });
  await colony.save();
  res.status(200).json({ colony });
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
  editColonyDetails,
  editTeam,
  createNewTeam,
  promoteorDemoteUser,
  createExpenditure,
  getActiveColonyDetails,
};
