const express = require("express");
const mongoose = require("mongoose");

const { requireAuth } = require("../middleware/auth");
const Certification = require("../models/Certification");
const Product = require("../models/Product");
const ProductCertification = require("../models/ProductCertification");

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const publicProduct = (product, certificationIds = []) => ({
  product_id: product._id,
  name: product.name,
  pharma_type: product.pharma_type,
  temp_min: product.temp_min,
  temp_max: product.temp_max,
  specifications: product.specifications,
  certification_ids: certificationIds,
  created_at: product.created_at,
  updated_at: product.updated_at,
});

const parseCertificationIds = (certificationIds = []) => {
  if (!Array.isArray(certificationIds)) {
    return { error: "certification_ids must be an array" };
  }

  const uniqueIds = [...new Set(certificationIds.filter(Boolean).map(String))];
  const hasInvalidId = uniqueIds.some((id) => !isValidObjectId(id));

  if (hasInvalidId) {
    return { error: "One or more certification ids are invalid" };
  }

  return { ids: uniqueIds };
};

const validateCertificationsExist = async (certificationIds) => {
  if (!certificationIds.length) {
    return null;
  }

  const count = await Certification.countDocuments({ _id: { $in: certificationIds } });

  if (count !== certificationIds.length) {
    return "One or more certifications were not found";
  }

  return null;
};

const syncProductCertifications = async (productId, certificationIds) => {
  await ProductCertification.deleteMany({ product_id: productId });

  if (!certificationIds.length) {
    return;
  }

  await ProductCertification.insertMany(
    certificationIds.map((certificationId) => ({
      product_id: productId,
      certification_id: certificationId,
    })),
    { ordered: false },
  );
};

const getCertificationIdsByProduct = async (productIds) => {
  const mappings = await ProductCertification.find({ product_id: { $in: productIds } });
  const grouped = new Map();

  mappings.forEach((mapping) => {
    const productId = mapping.product_id.toString();
    const certificationIds = grouped.get(productId) || [];
    certificationIds.push(mapping.certification_id);
    grouped.set(productId, certificationIds);
  });

  return grouped;
};

const validateProductPayload = (payload, isPartial = false) => {
  const update = {};

  if (!isPartial || typeof payload.name === "string") {
    if (!payload.name || !payload.name.trim()) {
      return { error: "Product name is required" };
    }

    update.name = payload.name;
  }

  if (!isPartial || typeof payload.pharma_type === "string") {
    if (!payload.pharma_type || !payload.pharma_type.trim()) {
      return { error: "Product pharma_type is required" };
    }

    update.pharma_type = payload.pharma_type;
  }

  if (!isPartial || payload.temp_min !== undefined) {
    const tempMin = Number(payload.temp_min);

    if (!Number.isFinite(tempMin)) {
      return { error: "Product temp_min must be a number" };
    }

    update.temp_min = tempMin;
  }

  if (!isPartial || payload.temp_max !== undefined) {
    const tempMax = Number(payload.temp_max);

    if (!Number.isFinite(tempMax)) {
      return { error: "Product temp_max must be a number" };
    }

    update.temp_max = tempMax;
  }

  const nextTempMin = update.temp_min ?? payload.currentTempMin;
  const nextTempMax = update.temp_max ?? payload.currentTempMax;

  if (Number.isFinite(nextTempMin) && Number.isFinite(nextTempMax) && nextTempMin > nextTempMax) {
    return { error: "Product temp_min cannot be greater than temp_max" };
  }

  if (!isPartial || typeof payload.specifications === "string") {
    update.specifications = payload.specifications || "";
  }

  return { update };
};

router.get("/", requireAuth, async (req, res) => {
  const products = await Product.find().sort({ name: 1 });
  const certificationIdsByProduct = await getCertificationIdsByProduct(products.map((product) => product._id));

  res.json({
    products: products.map((product) => (
      publicProduct(product, certificationIdsByProduct.get(product._id.toString()) || [])
    )),
  });
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const parsedCertificationIds = parseCertificationIds(req.body.certification_ids);

    if (parsedCertificationIds.error) {
      return res.status(400).json({ message: parsedCertificationIds.error });
    }

    const certificationError = await validateCertificationsExist(parsedCertificationIds.ids);

    if (certificationError) {
      return res.status(400).json({ message: certificationError });
    }

    const validatedPayload = validateProductPayload(req.body);

    if (validatedPayload.error) {
      return res.status(400).json({ message: validatedPayload.error });
    }

    const product = await Product.create(validatedPayload.update);
    await syncProductCertifications(product._id, parsedCertificationIds.ids);

    return res.status(201).json({
      message: "Product created successfully",
      product: publicProduct(product, parsedCertificationIds.ids),
    });
  } catch (error) {
    return res.status(500).json({ message: "Product creation failed" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Product id is invalid" });
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const certificationIdsByProduct = await getCertificationIdsByProduct([product._id]);

  return res.json({
    product: publicProduct(product, certificationIdsByProduct.get(product._id.toString()) || []),
  });
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Product id is invalid" });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const validatedPayload = validateProductPayload({
      ...req.body,
      currentTempMin: product.temp_min,
      currentTempMax: product.temp_max,
    }, true);

    if (validatedPayload.error) {
      return res.status(400).json({ message: validatedPayload.error });
    }

    let certificationIds = null;

    if (req.body.certification_ids !== undefined) {
      const parsedCertificationIds = parseCertificationIds(req.body.certification_ids);

      if (parsedCertificationIds.error) {
        return res.status(400).json({ message: parsedCertificationIds.error });
      }

      const certificationError = await validateCertificationsExist(parsedCertificationIds.ids);

      if (certificationError) {
        return res.status(400).json({ message: certificationError });
      }

      certificationIds = parsedCertificationIds.ids;
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, validatedPayload.update, {
      new: true,
      runValidators: true,
    });

    if (certificationIds) {
      await syncProductCertifications(updatedProduct._id, certificationIds);
    }

    const certificationIdsByProduct = await getCertificationIdsByProduct([updatedProduct._id]);

    return res.json({
      message: "Product updated successfully",
      product: publicProduct(
        updatedProduct,
        certificationIdsByProduct.get(updatedProduct._id.toString()) || [],
      ),
    });
  } catch (error) {
    return res.status(500).json({ message: "Product update failed" });
  }
});

module.exports = router;
