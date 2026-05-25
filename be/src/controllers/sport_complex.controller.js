import jwt from "jsonwebtoken";
import { 
    getSportComplexDetailsService,
    searchSportComplexService,
    getComplexesMapService,
    getFeaturedCourtsService,
    getAllSportComplexService
} from "../services/sport_complex.service.js";

const getAllSportComplex = async (req, res) => {
    try {
        const pageRaw = Number(req.query.page);
        const limitRaw = Number(req.query.limit);

        const page = pageRaw > 0 ? pageRaw : 1;
        const limit = limitRaw > 0 ? limitRaw : 10;

        const data = await getAllSportComplexService(page, limit);

        return res.json(data);
    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
};

const getSportComplexDetails = async (req, res) => {
    try {
        const { slug } = req.params;
        const data = await getSportComplexDetailsService(slug);
        return res.json(data);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
}

const searchSportComplex = async (req, res) => {
    try {
        const isValidString = (value) =>
            value === undefined || typeof value === 'string';

        if(!isValidString(req.query.keyword) || 
        !isValidString(req.query.city) || 
        !isValidString(req.query.district) || 
        !isValidString(req.query.fieldTypes)) {
            return res.status(400).json({ message: 'Invalid input' });
        }
        
        const keyword = (req.query.keyword || '').trim();
        const city = (req.query.city || '').trim();
        const district = (req.query.district || '').trim();
        const fieldTypes = (req.query.fieldTypes || '').trim();
        
        const pageRaw = Number(req.query.page);
        const limitRaw = Number(req.query.limit);
        const page = pageRaw > 0 ? pageRaw : 1;
        const limit = limitRaw > 0 ? limitRaw : 10;

        const data = await searchSportComplexService(keyword, city, district, fieldTypes, page, limit);
        return res.json(data);
    }catch (err) {
        return res.status(400).json({ message: err.message });
    }   
}

const getSportComplexByNearbyLocation = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        const data = await getSportComplexByNearbyLocationService(lat, lng);
        return res.json(data);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
}

export const getComplexesMapController = async (req, res) => {
    try {
      const result = await getComplexesMapService();

      return res.status(200).json(result);
    } catch (error) {
      console.error(
        "Get map complexes error:",
        error
      );

      return res.status(500).json({
        message:
          "Internal server error",
      });
    }
  };

    const getOptionalUserIdFromRequest = (req) => {
        const token = req.cookies?.access_token;

        if (!token) {
            return null;
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded?.id || null;
        } catch {
            return null;
        }
    };

    const getFeaturedCourts = async (req, res) => {
        try {
            const tab = req.query.tab || "all";
            const userId = getOptionalUserIdFromRequest(req);
            const data = await getFeaturedCourtsService({ tab, userId });

            return res.status(200).json(data);
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }
    };

    export { getSportComplexDetails, searchSportComplex, getSportComplexByNearbyLocation, getFeaturedCourts, getAllSportComplex };
