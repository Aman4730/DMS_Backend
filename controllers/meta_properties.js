const express = require("express");
const router = express.Router();
const meta_property = require("../models/meta_property");
const docmetadata = require("../models/add_metadata");

router.post("/metaproperty", async (req, res) => {
  const id = req.body.id;
  const fieldname = req.body.fieldname;
  const fieldtype = req.body.fieldtype;
  const doctype = req.body.doctype;
  const docmetaid = JSON.stringify(req.body.meta_id);
  const metadata_name = req.body.metadata_name;
  const metaproperties = req.body.metaproperties;

  if (id) {
    try {
      const property = await meta_property.findByPk(id);
      if (!property) {
        return res.status(404).json({ message: "Property Not Found" });
      }

      await meta_property.update(
        {
          fieldname: fieldname,
          fieldtype: fieldtype,
        },
        {
          where: {
            id: id,
          },
        }
      );

      return res.status(200).json({ message: "Property Updated Successfully" });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Server Error: MetaProperty Update" });
    }
  } else {
    try {
      const response = await meta_property.create({
        metadata_id: docmetaid,
        doctype: doctype,
        metadata_name: metadata_name,
        fieldname: fieldname,
        fieldtype: fieldtype,
        metaproperties: Array.isArray(metaproperties)
          ? metaproperties
          : [metaproperties],
        meta_status: "true",
      });

      return res.status(201).json(response);
    } catch (error) {
      return res.status(500).json({ message: "Server Error: MetaProperty" });
    }
  }
});

router.post("metaproperties", async (req, res) => {
  try {
    const id = req.body.id;
    const fieldname = req.body.fieldname;
    const fieldtype = req.body.fieldtype;
    const propertiesname = req.body.propertiesname;
    const response = await meta_property.create({
      fieldname: fieldname,
      fieldtype: fieldtype,
      propertiesname: propertiesname,
    });

    return res.status(201).json(response);
  } catch (error) {
    return res.status(500).json({ message: "Server Error MetaProperty" });
  }
});

router.post("/getmetaproperties", async (req, res) => {
  try {
    const doctype = req.body.doctype;
    const workspace_name = req.body.workspace_name;
    const meta_data = await docmetadata.findOne({
      where: {
        doctype: doctype,
        workspace_name: workspace_name,
      },
    });
    if (!meta_data) {
      return res.status(404).send({ message: "No Meta Data Found" });
    }
    const meta_data_id = meta_data.id.toString();
    const response = await meta_property.findAll({
      where: {
        doctype: doctype,
        metadata_id: meta_data_id,
        meta_status: "true",
      },
      order: [["createdAt", "ASC"]],
    });
    return res.status(201).json(response);
  } catch (error) {
    return res.status(500).json({ message: "Server Error MetaPropertyget" });
  }
});


router.post("/getproperties", async (req, res) => {
  const doctype = req.body.doctype;
  const meta_id = JSON.stringify(req.body.meta_id);
  try {
    const response = await meta_property.findAll({
      attributes: [
        "fieldtype",
        "fieldname",
        "id",
        "metaproperties",
        "meta_status",
      ], // Specify the attributes you want to retrieve
      where: {
        doctype: doctype,
        metadata_id: meta_id,
      },
    });
    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({ message: "Server Error" });
  }
});

router.post("/deleteproperties", async (req, res) => {
  try {
    const propertyId = req.body.id;

    await meta_property.destroy({
      where: {
        id: propertyId,
      },
    });
    return res.status(200).json({ message: "Property Deleted Successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Delete Failed" });
  }
});
router.post("/metastatus", async (req, res) => {
  try {
    const id = parseInt(req.body.id);
    const meta = await meta_property.findByPk(id);
    if (!meta) {
      return res.status(404).json({ message: "Doctype Not Found" });
    }
    const status = req.body.status;
    if (status === "true" || status === "false") {
      meta.meta_status = status;
      await meta.save();
      return res
        .status(200)
        .json({ message: `Properties Have Been ${status}` });
    } else {
      return res.status(400).json({ message: "Invalid Status Provided" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
