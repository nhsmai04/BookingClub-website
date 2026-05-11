import {
  createReviewService,
  getReviewsService,
  getReviewByIdService,
  updateReviewService,
  deleteReviewService,
  getReviewsWithStatsService,
  getDetailReviewByUserIdService
} from "../services/review.service.js";

// CREATE
export const createReview = async (req, res) => {
  try {
    const userId = req.user.id;

    const review = await createReviewService({
      ...req.body,
      user_id: userId,
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// UPDATE
export const updateReview = async (req, res) => {
  try {
    const userId = req.user.id;

    const review = await updateReviewService(
      req.params.id,
      userId,
      req.body
    );

    res.json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE
export const deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await deleteReviewService(req.params.id, userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET ALL
export const getReviews = async (req, res) => {
  try {
    const { complex_id } = req.query;

    const reviews = await getReviewsService(complex_id);
    res.json(reviews);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET BY ID
export const getReviewById = async (req, res) => {
  try {
    const review = await getReviewByIdService(req.params.id);
    res.json(review);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// GET WITH STATS
export const getReviewsWithStats = async (req, res) => {
  try {
    const data = await getReviewsWithStatsService(req.query);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

