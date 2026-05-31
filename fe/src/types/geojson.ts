export interface ComplexFeature {
    type: "Feature";

    geometry: {
        type: "Point";
        coordinates: [number, number];
    };

    properties: {
        _id: string;
        name: string;
        slug: string;
        sport_type: string,
        address: string;
        city: string;
        district: string;
        phone: string;
        opening_hours: string;
        closing_hours: string;
        image_url: string;
        map_url: string;
    };
}

export interface ComplexFeatureCollection {
    type: "FeatureCollection";
    features: ComplexFeature[];
}
