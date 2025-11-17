import { v2 as cloudinary } from "cloudinary";
import { menuModel } from "../models/menu.model.js";

/* ------------------------- ADD MENU ------------------------- */
export const addMenu = async (req, res) => {
  try {
    const { name, description, price, bestseller } = req.body;

    if (!name || !description || !price || bestseller === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (isNaN(price) || Number(price) <= 0) {
      return res.status(400).json({ message: "Price must be a valid positive number" });
    }

    const image1 = req.files?.image1?.[0];
    const image2 = req.files?.image2?.[0];
    const image3 = req.files?.image3?.[0];
    const image4 = req.files?.image4?.[0];
    const images = [image1, image2, image3, image4].filter(Boolean);

    if (images.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const imageURLs = await Promise.all(
      images.map(async (item) => {
        const result = await cloudinary.uploader.upload(item.path, {
          folder: "restaurant/menu",
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    const menuData = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      bestseller: bestseller === "true" || bestseller === true,
      image: imageURLs,
      date: Date.now(),
      createdBy: req.user._id,
    };

    if (req.user.role === "admin") {
      menuData.isApproved = true;
      menuData.status = "approved";
      menuData.approvedBy = req.user._id;
    }

    const menu = new menuModel(menuData);
    await menu.save();

    const io = req.app.get("io");
    io.emit("menu:new", menu);
    io.emit("menu:refresh");

    return res.status(201).json({
      success: true,
      message: "Menu added successfully",
      menu,
    });
  } catch (error) {
    console.error("addMenu error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ------------------------- GET ALL MENUS (ADMIN) ------------------------- */
export const getAllMenus = async (req, res) => {
  try {
    const menus = await menuModel.find().sort({ date: -1 });
    return res.status(200).json({
      success: true,
      count: menus.length,
      menus,
    });
  } catch (error) {
    console.error("getAllMenus error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

/* ------------------------- GET MENU BY ID ------------------------- */
export const getMenuById = async (req, res) => {
  try {
    const { id } = req.params;
    const menu = await menuModel.findById(id);

    if (!menu) {
      return res.status(404).json({ success: false, message: "Menu not found" });
    }

    return res.status(200).json({ success: true, menu });
  } catch (error) {
    console.error("getMenuById error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

/* ------------------------- UPDATE MENU ------------------------- */
export const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, bestseller } = req.body;

    const menu = await menuModel.findById(id);
    if (!menu) {
      return res.status(404).json({ success: false, message: "Menu not found" });
    }

    const image1 = req.files?.image1?.[0];
    const image2 = req.files?.image2?.[0];
    const image3 = req.files?.image3?.[0];
    const image4 = req.files?.image4?.[0];
    const images = [image1, image2, image3, image4].filter(Boolean);
    let imageURLs = menu.image;

    if (images.length > 0) {
      const uploaded = await Promise.all(
        images.map(async (item) => {
          const result = await cloudinary.uploader.upload(item.path, {
            folder: "restaurant/menu",
            resource_type: "image",
          });
          return result.secure_url;
        })
      );
      imageURLs = uploaded;
    }

    menu.name = name ? name.trim() : menu.name;
    menu.description = description ? description.trim() : menu.description;
    menu.price = price ? Number(price) : menu.price;
    menu.bestseller =
      bestseller !== undefined
        ? bestseller === "true" || bestseller === true
        : menu.bestseller;
    menu.image = imageURLs;

    await menu.save();

    const io = req.app.get("io");
    io.emit("menu:update", menu);
    io.emit("menu:refresh");

    return res.status(200).json({
      success: true,
      message: "Menu updated successfully",
      menu,
    });
  } catch (error) {
    console.error("updateMenu error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ------------------------- DELETE MENU ------------------------- */
export const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const menu = await menuModel.findById(id);

    if (!menu) {
      return res.status(404).json({ success: false, message: "Menu not found" });
    }

    await menuModel.findByIdAndDelete(id);

    const io = req.app.get("io");
    io.emit("menu:delete", { id });
    io.emit("menu:refresh");

    return res.status(200).json({
      success: true,
      message: "Menu deleted successfully",
    });
  } catch (error) {
    console.error("deleteMenu error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ------------------------- APPROVE MENU ------------------------- */
export const approveMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const menu = await menuModel.findById(id);

    if (!menu) {
      return res.status(404).json({ success: false, message: "Menu not found" });
    }

    menu.isApproved = true;
    menu.status = "approved";
    menu.approvedBy = req.user._id;
    menu.approvedAt = new Date();
    await menu.save();

    const io = req.app.get("io");
    io.emit("menu:approved", menu);
    io.emit("menu:refresh");

    return res.status(200).json({
      success: true,
      message: "Menu approved successfully",
      menu,
    });
  } catch (error) {
    console.error("approveMenu error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ------------------------- REJECT MENU ------------------------- */
export const rejectMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const menu = await menuModel.findById(id);
    if (!menu) {
      return res.status(404).json({ success: false, message: "Menu not found" });
    }

    menu.isApproved = false;
    menu.status = "rejected";
    menu.rejectionReason = reason || "Not specified";
    menu.approvedBy = req.user._id;
    await menu.save();

    const io = req.app.get("io");
    io.emit("menu:rejected", menu);
    io.emit("menu:refresh");

    return res.status(200).json({
      success: true,
      message: "Menu rejected successfully",
      menu,
    });
  } catch (error) {
    console.error("rejectMenu error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ------------------------- PUBLIC MENU LIST ------------------------- */
export const getPublicMenus = async (req, res) => {
  try {
    const menus = await menuModel
      .find({ isApproved: true, status: "approved" })
      .sort({ bestseller: -1, date: -1 })
      .select("name description price image bestseller date");

    // ✅ Return empty array instead of 404
    return res.status(200).json({
      success: true,
      count: menus.length,
      menus,
    });
  } catch (error) {
    console.error("getPublicMenus error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};