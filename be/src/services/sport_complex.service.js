import FieldImage from "../models/field_image.model.js";
import SportComplex from "../models/sport_complex.model.js";
import SubField from "../models/sub_field.model.js";
import Owner from "../models/owner.model.js";
import Review from "../models/review.model.js";
import Booking from "../models/booking.model.js";
import FieldTypeConfig from "../models/field_type_configs.model.js";
import PricingRule from "../models/pricing_rule.model.js";
import mongoose from "mongoose";
import { removeVietnameseAccents, escapeRegex } from "../utils/vietnamese.util.js";

const FEATURED_LIMIT = 4;

const formatCurrencyVnd = (value) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "0đ";
  }

  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
};

const buildFeaturedCardPipeline = ({ matchCondition = {}, sortCondition = { createdAt: -1 }, limit = FEATURED_LIMIT, extraAddFields = [] } = {}) => {
  return [
    { $match: matchCondition },
    {
      $lookup: {
        from: FieldImage.collection.name,
        let: { complexId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$complex_id", "$$complexId"] } } },
          { $sort: { is_primary: -1, created_at: 1 } },
          { $limit: 1 },
          {
            $project: {
              _id: 0,
              image_url: 1,
              image_type: 1,
              is_primary: 1,
              alt_text: 1,
            },
          },
        ],
        as: "coverImage",
      },
    },
    {
      $lookup: {
        from: FieldTypeConfig.collection.name,
        let: { complexId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$complex_id", "$$complexId"] } } },
          { $match: { is_active: true } },
          { $sort: { base_price: 1, field_type: 1 } },
          {
            $project: {
              _id: 1,
              complex_id: 1,
              field_type: 1,
              base_price: 1,
              is_active: 1,
            },
          },
        ],
        as: "fieldTypeConfigs",
      },
    },
    {
      $lookup: {
        from: Review.collection.name,
        let: { complexId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$complex_id", "$$complexId"] } } },
          {
            $group: {
              _id: null,
              totalReviews: { $sum: 1 },
              avgRating: { $avg: "$rating" },
            },
          },
        ],
        as: "reviewStats",
      },
    },
    {
      $unwind: {
        path: "$reviewStats",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        coverImage: { $arrayElemAt: ["$coverImage", 0] },
        activeBasePrices: {
          $map: {
            input: "$fieldTypeConfigs",
            as: "config",
            in: "$$config.base_price",
          },
        },
        avgRating: { $ifNull: ["$reviewStats.avgRating", 0] },
        totalReviews: { $ifNull: ["$reviewStats.totalReviews", 0] },
        ...extraAddFields.reduce((accumulator, item) => Object.assign(accumulator, item), {}),
      },
    },
    {
      $addFields: {
        priceValue: {
          $ifNull: [{ $min: "$activeBasePrices" }, 0],
        },
        imageUrl: { $ifNull: ["$coverImage.image_url", ""] },
        imageAlt: { $ifNull: ["$coverImage.alt_text", ""] },
      },
    },
    { $sort: sortCondition },
    { $limit: limit },
    {
      $project: {
        coverImage: 0,
        fieldTypeConfigs: 0,
        reviewStats: 0,
        activeBasePrices: 0,
      },
    },
  ];
};

const mapFeaturedCourt = (court) => {
  const avgRating = Number((court.avgRating ?? 0).toFixed(1));
  const priceValue = Number(court.priceValue ?? 0);

  return {
    _id: court._id,
    name: court.name,
    slug: court.slug,
    address: court.address,
    city: court.city,
    district: court.district,
    sport_type: court.sport_type,
    image_url: court.imageUrl || "",
    image_alt: court.imageAlt || court.name,
    price_value: priceValue,
    price_display: formatCurrencyVnd(priceValue),
    rating: avgRating,
    review_count: Number(court.totalReviews ?? 0),
  };
};

const normalizeFeaturedTab = (tab) => {
  const normalized = String(tab || "all").trim().toLowerCase();

  if (["all", "recommended", "recent", "popular"].includes(normalized)) {
    return normalized;
  }

  throw new Error("Invalid featured tab");
};

const getSportComplexDetailsService = async (slug) => {
  const result = await SportComplex.aggregate([
    { $match: { slug } },
    {
      $lookup: {
        from: "users",
        let: { ownerId: "$owner_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$ownerId"] } } },
          { $project: { _id: 0, name: 1, email: 1, phone: 1 } }
        ],
        as: "owner"
      }
    },
    { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: SubField.collection.name,
        let: { complexId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$complex_id", "$$complexId"] } } },
          {
            $project: {
              _id: 1,
              complex_id: 1,
              config_id: 1,
              field_name: 1,
              status: 1
            }
          }
        ],
        as: "subFields"
      }
    },
    {
      $lookup: {
        from: FieldImage.collection.name,
        let: { complexId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$complex_id", "$$complexId"] } } },
          {
            $project: {
              _id: 0,
              complex_id: 1,
              image_url: 1,
              image_type: 1,
              is_primary: 1,
              alt_text: 1
            }
          }
        ],
        as: "fieldImages"
      }
    },
    {
      $lookup: {
        from: FieldTypeConfig.collection.name,
        let: { complexId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$complex_id", "$$complexId"] } } },
          {
            $lookup: {
              from: PricingRule.collection.name,
              let: { configId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$config_id", "$$configId"] },
                        { $eq: ["$is_active", true] }
                      ]
                    }
                  }
                },
                { $sort: { priority: -1 } },
                {
                  $project: {
                    _id: 0,
                    complex_id: 1,
                    config_id: 1,
                    rule_name: 1,
                    day_of_week: 1,
                    start_hour: 1,
                    end_hour: 1,
                    price_multiplier: 1,
                    priority: 1,
                    is_active: 1
                  }
                }
              ],
              as: "pricingRules"
            }
          },
          { $sort: { field_type: 1 } },
          {
            $project: {
              _id: 1,
              complex_id: 1,
              field_type: 1,
              base_price: 1,
              min_duration: 1,
              slot_step: 1,
              buffer_time: 1,
              description: 1,
              is_active: 1,
              pricingRules: 1
            }
          }
        ],
        as: "fieldTypeConfigs"
      }
    },
    {
      $addFields: {
        owner_id: "$owner",
        
      }
    },
    {
      $project: {
        _id: 1,
        owner: 0,
        created_at: 0,
        updated_at: 0
      }
    }
  ]);

  if (!result.length) throw new Error("Sport complex not found");
  
  return result[0];
};

const searchSportComplexService = async (keyword, city, district, fieldType, page = 1, limit = 10) => {
  const pipeline = [];

  // 1. Lọc theo Keyword (Text Search) - Phải đặt ở đầu Pipeline nếu dùng $text
  if (keyword) {
    const keywords = removeVietnameseAccents(keyword.trim()).split(' ').filter(k => k);
   pipeline.push({
  $match: {
    $and: keywords.map(k => ({
      name_en: { $regex: escapeRegex(k) }
    }))
  }
  });
}

  // 2. Lọc theo Địa điểm (City, District) & phong chong  Injection 
  const matchLocation = {};
  if (city) 
    {
      const cityRegex = new RegExp(`^${escapeRegex(city)}$`, 'i'); // So khớp chính xác, không phân biệt hoa thường
      matchLocation.city = cityRegex;
    }
  if (district) 
    {
      const districtRegex = new RegExp(`^${escapeRegex(district)}$`, 'i'); // So khớp chính xác, không phân biệt hoa thường
      matchLocation.district = districtRegex;
    }

  if (Object.keys(matchLocation).length > 0) {
    pipeline.push({ $match: matchLocation });
  }

  // 3. Lookup sang bảng FieldTypeConfig để lấy thông tin loại sân
  pipeline.push({
    $lookup: {
      from: "fieldtypeconfigs",
      localField: "_id",
      foreignField: "complex_id",
      as: "field_configs"
    }
  });

  pipeline.push({
    $lookup: {
      from: FieldImage.collection.name,
      let: { complexId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$complex_id", "$$complexId"] } } },
        { $sort: { is_primary: -1, created_at: 1 } },
        {
          $project: {
            _id: 0,
            image_url: 1,
            image_type: 1,
            is_primary: 1,
            alt_text: 1
          }
        }
      ],
      as: "fieldImages"
    }
  });

  fieldType = fieldType.trim().toLowerCase();
  // 4. Lọc theo Loại sân (Field Type)
  // Vì FE gửi về 1 môn thể thao cụ thể (fieldType)
  if (fieldType) {
    pipeline.push({
      $match: {
        field_configs: {
        $elemMatch:{
          field_type: fieldType,
          is_active: true
        }
       } // Chỉ lấy những sân đang hoạt động
      }
    });
  }

  // 5. Pagination & Metadata bằng $facet
  // $facet cho phép chạy nhiều pipeline nhỏ cùng lúc: một cái lấy data, một cái đếm tổng
  pipeline.push({
    $facet: {
      metadata: [{ $count: "total" }],
      data: [
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: { field_configs: 0, created_at: 0 } }
      ]
    }
  });

  const result = await SportComplex.aggregate(pipeline);

  // Xử lý kết quả trả về
  const data = result[0].data;
  const totalItems = result[0].metadata[0]?.total || 0;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    sportComplexes: data,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      limit
    }
  };
};

const getSportComplexByNearbyLocationService = async (lat, lng) => {
  if (!lat || !lng) {
    throw new Error("Latitude and longitude are required");
  }
  const sportComplexes = await SportComplex.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: 5000
      }
    }
  }).select("-created_at");
  return sportComplexes;
};

export const getComplexesMapService = async () => {
  const complexes = await SportComplex.aggregate([
    {
      $lookup: {
        from: "fieldimages",
        let: {
          complexId: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  "$complex_id",
                  "$$complexId",
                ],
              },
              image_type: "Overall",
            },
          },

          {
            $sort: {
              is_primary: -1,
              created_at: 1,
            },
          },

          {
            $limit: 1,
          },
        ],
        as: "overall_image",
      },
    },

    {
      $project: {
        type: {
          $literal: "Feature",
        },

        geometry: {
          type: "$location.type",
          coordinates:
            "$location.coordinates",
        },

        properties: {
          _id: "$_id",
          name: "$name",
          slug: "$slug",
          sport_type: "$sport_type",
          address: "$address",
          city: "$city",
          district: "$district",
          phone: "$phone",
          map_url: "$map_url",
          opening_hours:
            "$opening_hours",
          closing_hours:
            "$closing_hours",

          image_url: {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$overall_image.image_url",
                  0,
                ],
              },
              "",
            ],
          },
        },
      },
    },
  ]);

  return {
    type: "FeatureCollection",
    features: complexes,
  };
};

export const getFeaturedCourtsService = async ({ tab = "all", userId = null } = {}) => {
  const normalizedTab = normalizeFeaturedTab(tab);

  if (normalizedTab === "recent") {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return {
        tab: normalizedTab,
        total: 0,
        items: [],
      };
    }

    const recentBookings = await Booking.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(userId),
          status: { $in: ["pending", "confirmed", "completed"] },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$complex_id",
          latestBookingAt: { $first: "$createdAt" },
        },
      },
      { $sort: { latestBookingAt: -1 } },
      { $limit: FEATURED_LIMIT },
    ]);

    if (!recentBookings.length) {
      return {
        tab: normalizedTab,
        total: 0,
        items: [],
      };
    }

    const orderedComplexIds = recentBookings.map((booking) => booking._id);

    const complexes = await SportComplex.aggregate(
      buildFeaturedCardPipeline({
        matchCondition: {
          _id: { $in: orderedComplexIds },
        },
        sortCondition: {
          orderIndex: 1,
        },
        extraAddFields: [
          {
            orderIndex: {
              $indexOfArray: [orderedComplexIds, "$_id"],
            },
          },
        ],
      })
    );

    return {
      tab: normalizedTab,
      total: complexes.length,
      items: complexes.map(mapFeaturedCourt),
    };
  }

  if (normalizedTab === "popular") {
    // Popular = top complexes by booking count
    const popularBookings = await Booking.aggregate([
      {
        $match: {
          status: { $in: ["pending", "confirmed", "completed"] },
        },
      },
      {
        $group: {
          _id: "$complex_id",
          bookingCount: { $sum: 1 },
        },
      },
      { $sort: { bookingCount: -1 } },
      { $limit: FEATURED_LIMIT },
    ]);

    if (!popularBookings.length) {
      return {
        tab: normalizedTab,
        total: 0,
        items: [],
      };
    }

    const orderedComplexIds = popularBookings.map((b) => b._id);

    const complexes = await SportComplex.aggregate(
      buildFeaturedCardPipeline({
        matchCondition: { _id: { $in: orderedComplexIds } },
        sortCondition: { orderIndex: 1 },
        extraAddFields: [
          {
            orderIndex: {
              $indexOfArray: [orderedComplexIds, "$_id"],
            },
          },
        ],
      })
    );

    return {
      tab: normalizedTab,
      total: complexes.length,
      items: complexes.map(mapFeaturedCourt),
    };
  }

  const sortCondition =
    normalizedTab === "recommended"
      ? { avgRating: -1, totalReviews: -1, createdAt: -1 }
      : { createdAt: -1 };

  const complexes = await SportComplex.aggregate(
    buildFeaturedCardPipeline({
      sortCondition,
    })
  );

  return {
    tab: normalizedTab,
    total: complexes.length,
    items: complexes.map(mapFeaturedCourt),
  };
};

const getAllSportComplexService = async (
  page = 1,
  limit = 10
) => {
    const pipeline = [];

    // Lookup loại sân
    pipeline.push({
        $lookup: {
            from: "fieldtypeconfigs",
            localField: "_id",
            foreignField: "complex_id",
            as: "field_configs"
        }
    });

    // Lookup ảnh
    pipeline.push({
        $lookup: {
            from: FieldImage.collection.name,
            let: { complexId: "$_id" },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $eq: [
                                "$complex_id",
                                "$$complexId"
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        is_primary: -1,
                        created_at: 1
                    }
                },
                {
                    $project: {
                        _id: 0,
                        image_url: 1,
                        image_type: 1,
                        is_primary: 1,
                        alt_text: 1
                    }
                }
            ],
            as: "fieldImages"
        }
    });

    // Pagination + metadata
    pipeline.push({
        $facet: {
            metadata: [
                {
                    $count: "total"
                }
            ],
            data: [
                {
                    $skip: (page - 1) * limit
                },
                {
                    $limit: limit
                },
                {
                    $project: {
                        field_configs: 0,
                        created_at: 0
                    }
                }
            ]
        }
    });

    const result = await SportComplex.aggregate(
        pipeline
    );

    const data = result[0].data;
    const totalItems =
        result[0].metadata[0]?.total || 0;

    const totalPages = Math.ceil(
        totalItems / limit
    );

    return {
        sportComplexes: data,
        pagination: {
            totalItems,
            totalPages,
            currentPage: page,
            limit
        }
    };
};

export { getSportComplexDetailsService, searchSportComplexService, getSportComplexByNearbyLocationService, getAllSportComplexService };