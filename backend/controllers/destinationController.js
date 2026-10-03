const { Destination, Property } = require('../models');

/**
 * @desc    Get all public destinations with filtering, search, and pagination
 * @route   GET /api/destinations
 * @access  Public
 */
const getDestinations = async (req, res, next) => {
  try {
    const { district, search, tag, sort, page = 1, limit = 20 } = req.query;

    const query = { isActive: true };

    if (district) {
      query.district = district;
    }

    if (tag) {
      query.tag = { $regex: new RegExp(tag, 'i') };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { highlights: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { name: 1 };
    if (sort) {
      const parts = sort.split(':');
      sortOption[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [destinations, total] = await Promise.all([
      Destination.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Destination.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: destinations.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
      data: destinations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single destination by slug (or ID) with related destinations & local stays
 * @route   GET /api/destinations/:slug
 * @access  Public
 */
const getDestinationBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Check by slug first (case-insensitive), fallback to ObjectId
    let destination = await Destination.findOne({
      slug: slug.toLowerCase(),
      isActive: true,
    }).lean();

    if (!destination && slug.match(/^[0-9a-fA-F]{24}$/)) {
      destination = await Destination.findOne({
        _id: slug,
        isActive: true,
      }).lean();
    }

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: `Destination not found with slug or ID "${slug}"`,
      });
    }

    // Resolve related destinations if any
    let relatedDestinations = [];
    if (destination.relatedSlugs && destination.relatedSlugs.length > 0) {
      relatedDestinations = await Destination.find({
        slug: { $in: destination.relatedSlugs },
        isActive: true,
      })
        .select('name slug tag district shortDescription images')
        .lean();
    }

    // Cross-link nearby approved properties in the same district or matching location
    const nearbyStays = await Property.find({
      isActive: true,
      status: 'approved',
      $or: [
        { 'location.district': destination.district },
        { 'location.address': { $regex: new RegExp(destination.name, 'i') } },
        { title: { $regex: new RegExp(destination.name, 'i') } },
      ],
    })
      .select('title slug type rating images pricing location tags featured')
      .limit(6)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        ...destination,
        relatedDestinations,
        nearbyStays,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new destination
 * @route   POST /api/destinations
 * @access  Private (Admin only)
 */
const createDestination = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      tag,
      district,
      shortDescription,
      description,
      whyVisit,
      highlights,
      travelInfo,
      permitNote,
      bestTimeToVisit,
      images,
      relatedSlugs,
      isActive,
    } = req.body;

    if (!name || !shortDescription || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name, shortDescription, and description are required',
      });
    }

    const finalSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await Destination.findOne({ slug: finalSlug });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Destination with slug "${finalSlug}" already exists`,
      });
    }

    const destination = await Destination.create({
      slug: finalSlug,
      name,
      tag,
      district: district || 'North Sikkim',
      shortDescription,
      description,
      whyVisit: Array.isArray(whyVisit) ? whyVisit : [],
      highlights: Array.isArray(highlights) ? highlights : [],
      travelInfo,
      permitNote,
      bestTimeToVisit,
      images: images || {},
      relatedSlugs: Array.isArray(relatedSlugs) ? relatedSlugs : [],
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: 'Destination created successfully',
      data: destination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing destination
 * @route   PUT /api/destinations/:id
 * @access  Private (Admin only)
 */
const updateDestination = async (req, res, next) => {
  try {
    const { id } = req.params;

    let destination = await Destination.findById(id);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: `Destination not found with id ${id}`,
      });
    }

    // If slug is being updated, verify uniqueness
    if (req.body.slug && req.body.slug.toLowerCase() !== destination.slug) {
      const slugExists = await Destination.findOne({
        slug: req.body.slug.toLowerCase(),
        _id: { $ne: id },
      });
      if (slugExists) {
        return res.status(409).json({
          success: false,
          message: `Slug "${req.body.slug}" is already in use by another destination`,
        });
      }
      req.body.slug = req.body.slug.toLowerCase().trim();
    }

    destination = await Destination.findByIdAndUpdate(
      id,
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Destination updated successfully',
      data: destination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete or deactivate a destination
 * @route   DELETE /api/destinations/:id
 * @access  Private (Admin only)
 */
const deleteDestination = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    const destination = await Destination.findById(id);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: `Destination not found with id ${id}`,
      });
    }

    if (permanent === 'true') {
      await Destination.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        message: `Destination "${destination.name}" permanently deleted`,
      });
    }

    destination.isActive = false;
    await destination.save();

    res.status(200).json({
      success: true,
      message: `Destination "${destination.name}" deactivated successfully`,
      data: destination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDestinations,
  getDestinationBySlug,
  createDestination,
  updateDestination,
  deleteDestination,
};
