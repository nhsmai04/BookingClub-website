import express from 'express';
import { getSportComplexDetails, searchSportComplex, getComplexesMapController, getFeaturedCourts, getAllSportComplex } from '../controllers/sport_complex.controller.js';
const sportComplexRouter = express.Router();

sportComplexRouter.get('/detail/:slug', getSportComplexDetails);
sportComplexRouter.get('/search', searchSportComplex);
sportComplexRouter.get('/map', getComplexesMapController);
sportComplexRouter.get('/featured', getFeaturedCourts);
sportComplexRouter.get('/all', getAllSportComplex);
export default sportComplexRouter;
