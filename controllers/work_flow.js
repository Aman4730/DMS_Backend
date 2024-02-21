const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const work_flow = require("../models/work_flow");
const middleware = require("../middleware/authorization");


router.post("/createworkflow", middleware, async (req, res) => {
  try {
    const user_id = req.decodedToken.user.id;

    const {
      id,
      policy_name,
      workspace_name,
      group_admin,
      user_email,
      l_1,
      l_2,
    } = req.body;

    // Validation
    if (!policy_name || !workspace_name || !group_admin || !user_email || user_email.length === 0) {
      return res.status(400).send({ message: "Invalid Input Data" });
    }

    let workFlow;
    const existingWorkflow = await work_flow.findOne({
      where: { policy_name },
    });

    if (existingWorkflow && (!id || (id && existingWorkflow.id !== id))) {
      return res.status(400).send({ message: "Policy Name Already Exists" });
    }


    if (id) {
      // Update existing workflow
      workFlow = await work_flow.findByPk(id);
      if (!workFlow) {
        return res.status(404).json({ message: "Workflow Not Found" });
      }

      workFlow.policy_name = policy_name;
      workFlow.workspace_name = workspace_name;
      workFlow.group_admin = group_admin;
      workFlow.user_email = user_email;
      workFlow.l_1 = l_1;
      workFlow.l_2 = l_2;

      await workFlow.save();
      return res.status(200).send({ message: "Workflow Updated Successfully", workFlow });
    } else {
      // Create new workflow
      workFlow = await work_flow.create({
        policy_name,
        workspace_name,
        group_admin,
        user_email,
        l_1,
        l_2,
      });

      return res.status(201).send({ message: "Workflow Created Successfully", workFlow });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Server Error" });
  }
});

router.post("/getworkflow", async (req, res) => {
  try {
    const allWorkFlow = await work_flow.findAll({
      order: [['createdAt', 'DESC']],
    });    
    return res.status(200).json({ allWorkFlow });
  } catch (error) {
    console.log(error);
  }
});

router.post("/deleteworkflow", async (req, res) => {
  try {
    const id = req.body.id;
    await work_flow.destroy({ where: { id: id } });
    return res.status(200).json({ message: "Work Flow Delete Successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
