const axios = require("axios");
const Decision = require("../models/decision");

const updateDecision = async function () {
  const now = new Date();
  const motionsToUpdate = await Decision.find({
    votingEndsAt: { $lt: now },
    status: "Pending",
  }).exec();
  for (let motion of motionsToUpdate) {
    let inFavorStake = 0;
    let againstStake = 0;
    let forced = motion.forced;
    let newStatus = "";

    if (!forced) {
      for (let vote of motion.votes) {
        if (vote.vote === "In Favor") {
          inFavorStake += vote.stake;
        } else {
          againstStake += vote.stake;
        }

        inFavorStake > againstStake ? "Passed" : "Rejected";
      }
    } else newStatus = "Passed";
    console.log(newStatus)  

    await Decision.updateOne(
      { _id: motion._id },
      { $set: { status: newStatus } }
    );

    const endpointUrl = "http://localhost:5000/colony";

    if (newStatus === "Passed") {
      try {
        let response;
        switch (motion.type) {
          case "Expenditure":
            response = await axios.post(
              `${endpointUrl}/createExpenditure`,
              motion
            );
            break;
          case "Reassign":
            response = await axios.post(
              `${endpointUrl}/promote`,
              motion
            );
            break;
          case "MintTokens":
            response = await axios.post(
              `${endpointUrl}/mint-tokens`,
              motion
            );
            break;
          default:
            console.log("Miscellaneous decision type");
        }
        console.log("Action response:", response.data);
      } catch (error) {
        // console.error(`Error processing ${motion.type} decision:`, error);
      }
    }
  }
};

module.exports = updateDecision;
