const express = require("express");
const router = express.Router();
const doctype = require("../models/doctype");
const docmetadata = require("../models/add_metadata");
const meta_property = require("../models/meta_property");
const { Op } = require("sequelize");

// POST /doctypes
router.post("/createdoctype", async (req, res) => {
  try {
    const doc_type = req.body.doctype;
    const newDocType = await doctype.create({
      doctype_name: doc_type,
      doc_status: "true",
    });
    res.status(201).json(newDocType);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});
router.post("/doclist", async (req, res) => {
  try {
    const workspaceAuths = await doctype.findAll({
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(workspaceAuths);
  } catch (err) {
    return res.status(500).json({ message: "Server Error" });
  }
});

router.post("/deletedoc", async (req, res) => {
  try {
    const id = req.body.id;
    const docType = await doctype.findByPk(id);
    if (!docType) {
      return res.status(404).json({ message: "Document Type Not Found" });
    }
    await docType.destroy();
    return res.status(204).json({ message: "Document Type Deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
});
//   cabinet_name, worspace_name, doctype,metadeta_name

router.post("/createmetadata", async (req, res) => {
  try {
    const doctype = req.body.doctype;
    const cabinet_name = req.body.cabinet_name;
    const workspace_name = req.body.workspace_name;
    const metadata_name = req.body.metadata_name;
    let check_meta_data = await docmetadata.findOne({
      where: {
        doctype: doctype,
        [Op.or]: [
          { cabinet_name: cabinet_name },
          { workspace_name: workspace_name },
        ],
      },
    });

    // if (check_meta_data) {
    //   // Check which condition is satisfied
    //   if (
    //     check_meta_data.cabinet_name === cabinet_name &&
    //     check_meta_data.workspace_name === workspace_name &&
    //     check_meta_data.doctype === doctype
    //   ) {
    //     return res
    //       .status(400)
    //       .json({ success: false, message: "Please make changes to doctype" });
    //   } else if (check_meta_data.cabinet_name === cabinet_name) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "Please make changes to cabinet_name",
    //     });
    //   } else if (check_meta_data.workspace_name === workspace_name) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "Please make changes to workspace_name",
    //     });
    //   } else {
    //     return res
    //       .status(500)
    //       .json({ success: false, message: "Unexpected condition" });
    //   }
    // }
    if (check_meta_data) {
      const message =
        check_meta_data.cabinet_name === cabinet_name &&
        check_meta_data.workspace_name === workspace_name &&
        check_meta_data.doctype === doctype
          ? "Please Make Changes To Doctype"
          : check_meta_data.cabinet_name === cabinet_name
          ? "Please Make Changes To Cabinet_name"
          : check_meta_data.workspace_name === workspace_name
          ? "Please Make Changes To Workspace_name"
          : "Unexpected Condition";

      return res.status(400).json({ success: false, message });
    }
    const newmetadataType = await docmetadata.create({
      cabinet_name: cabinet_name,
      workspace_name: workspace_name,
      doctype: doctype,
      metadata_name: metadata_name,
    });
    return res
      .status(201)
      .json({ message: "Doc Metadata Created Sucessfully.", newmetadataType });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
});

// delete
router.post("/deletemetadata", async (req, res) => {
  const id = parseInt(req.body.id);

  const row = await docmetadata.findOne({
    where: {
      id: id,
    },
  });

  if (!row) {
    return res
      .status(404)
      .json({ success: false, message: "Metadata Not Found" });
  }

  // docmetadata
  //   .destroy({
  //     where: {
  //       id: id,
  //     },
  //   })
  //   .then(async () => {
  //     const response = await meta_property.findAll({
  //       where: {
  //         doctype: row.doctype,

  //       },
  //     });
  //     res
  //       .status(200)
  //       .json({ success: true, message: "Metadata deleted successfully" });
  //   })

  const doctypeToDelete = row.id.toString();

  // Step 1: Find all files associated with the doctype
  const filesToDelete = await meta_property.findAll({
    where: {
      doctype: doctypeToDelete,
    },
  });

  // Step 2: Delete metadata and associated files
  docmetadata
    .destroy({
      where: {
        id: id,
      },
    })
    .then(async () => {
      // Delete associated files
      const fileDeletionPromises = filesToDelete.map((file) => file.destroy());
      await Promise.all(fileDeletionPromises);

      res
        .status(200)
        .json({ success: true, message: "Metadata Deleted Successfully" });
    })
    .catch(() => {
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    });
});

router.post("/metalist", async (req, res) => {
  try {
    const workspaceAuths = await docmetadata.findAll({});
    return res.status(200).json(workspaceAuths);
  } catch (err) {
    return res.status(500).json({ message: "Server Error" });
  }
});

router.post("/metaform", async (req, res) => {
  try {
    const doctype = req.body.doctype;
    const docmeta = await docmetadata.findAll({
      where: {
        doctype: doctype,
      },
    });
    return res.status(200).json(docmeta);
  } catch (error) {
    return res.status(500).json({ message: "Error In Metaform Api" });
  }
});

router.post("/docstatus", async (req, res) => {
  try {
    const id = parseInt(req.body.id);
    const user = await doctype.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }
    user.doc_status = req.body.user_status.toString();
    await user.save();
    return res.status(200).json({
      message: `Doctype Has Been ${
        user.doc_status === "true" ? "Enabled" : "Disabled"
      }`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
module.exports = router;

//  filed of doc_type metadata
