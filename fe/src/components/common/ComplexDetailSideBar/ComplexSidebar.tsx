import { useNavigate, useParams } from "react-router-dom";

import type { ComplexFeature } from "../../../types/geojson";
import "./ComplexSidebar.css"
import {
    MapPin,
    Building2,
    Phone,
    Clock3,
    Navigation
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import { useState, useEffect, useMemo } from "react";
import { getSportDetail, type SportComplexDetail, type SubFieldDetail } from "../../../services/sportDetail.api";
import SubFieldList from "../../../features/SubFieldList/SubFieldList";
import Review from "../Review/Review";
import { type ReviewStats } from "../../../types/review";
import { getReviewStats } from "../../../services/review.api";

interface Props {
    complex: ComplexFeature | null;
    onClose: () => void;
}

function ComplexSidebar({
    complex,
    onClose,
}: Props) {
    const navigate = useNavigate();

    const props = complex?.properties;

    const slug = props?.slug;
    const complexId = props?._id;
    // Lưu trữ dữ liệu và trạng thái loading
    const [court, setCourt] = useState<SportComplexDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCourtId, setSelectedCourtId] = useState<string | undefined>(undefined);
    const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
    const [activeTab, setActiveTab] = useState<
        "info" | "courts" | "reviews"
    >("info");

    useEffect(() => {
        if (slug) {
            setLoading(true);
            getSportDetail(slug)
                .then((data: SportComplexDetail) => {
                    setCourt(data);
                    if (data.subFields && data.subFields.length > 0) {
                        setSelectedCourtId(data.subFields[0].id);
                    }
                    setLoading(false);
                })
                .catch((err: Error) => {
                    console.error("Lỗi", err);
                    setError(err.message);
                    setLoading(false);
                });
        }
    }, [slug]);

    // Lấy dữ liệu cho SubFieldList
    const normalizedSubFields = useMemo(() => {
        return court?.subFields.map((s: SubFieldDetail) => ({
            ...s,
            config_id: {
                field_type: s.sportType,
                base_price: s.basePrice,
                pricingRules: s.pricingRules
            }
        })) || [];
    }, [court]);

    useEffect(() => {
        if (!complexId) return;
        getReviewStats(complexId)
            .then((data) => {
                setReviewStats(data);
            })
            .catch((err) => {
                console.error("Review error", err);
            });
    }, [complexId]);

    return (
        <aside
            className={`
                complex-map-sidebar
                ${complex
                    ? "complex-map-sidebar--open"
                    : ""
                }
            `}
        >
            <button className="complex-map-sidebar__close"
                onClick={onClose}
            >
                ✕
            </button>

            <img
                src={
                    props?.image_url
                }
                alt={
                    props?.name
                }
                className="complex-map-sidebar__image"
            />

            <div className="complex-map-sidebar__content">
                <h2 className="complex-map-sidebar__title">
                    {props?.name}
                </h2>

                <div className="complex-sidebar-tabs">
                    <button
                        className={`complex-sidebar-tabs__item ${activeTab === "info"
                            ? "complex-sidebar-tabs__item--active"
                            : ""
                            }`}
                        onClick={() => setActiveTab("info")}
                    >
                        Thông tin
                    </button>

                    <button
                        className={`complex-sidebar-tabs__item ${activeTab === "courts"
                            ? "complex-sidebar-tabs__item--active"
                            : ""
                            }`}
                        onClick={() => setActiveTab("courts")}
                    >
                        Danh sách sân
                    </button>

                    <button
                        className={`complex-sidebar-tabs__item ${activeTab === "reviews"
                            ? "complex-sidebar-tabs__item--active"
                            : ""
                            }`}
                        onClick={() => setActiveTab("reviews")}
                    >
                        Đánh giá
                    </button>
                </div>
                {activeTab === "info" && (
                    <div className="complex-sidebar-tabs__panel">
                        <p>
                            <MapPin className="complex-map-sidebar__icon" />
                            {props?.address}
                        </p>

                        {props?.map_url && (
                            <p className="complex-map-sidebar__direction">
                                <Navigation className="complex-map-sidebar__icon" />
                                <a
                                    href={props.map_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="complex-map-sidebar__link"
                                >
                                    Xem chỉ đường
                                </a>
                            </p>
                        )}

                        <p>
                            <Building2 className="complex-map-sidebar__icon" />
                            {props?.district}, {props?.city}
                        </p>

                        <p>
                            <Phone className="complex-map-sidebar__icon" />
                            {props?.phone}
                        </p>

                        <p>
                            <Clock3 className="complex-map-sidebar__icon" />
                            {props?.opening_hours}
                            {" - "}
                            {props?.closing_hours}
                        </p>
                    </div>
                )}

                {activeTab === "courts" && (
                    <div className="complex-sidebar-tabs__panel">
                        <div className="complex-map-sidebar__subfields">
                            <SubFieldList
                                dataSource={normalizedSubFields}
                            />
                        </div>
                    </div>
                )}

                {activeTab === "reviews" && (
                    <div className="complex-sidebar-tabs__panel">
                        <div className="complex-map-sidebar__rating">
                            <Review
                                overallRating={reviewStats?.avgRating || 0}
                                totalReviews={reviewStats?.totalReviews || 0}
                                reviews={reviewStats?.reviews || []}
                                onShowAllClick={() =>
                                    console.log("Mở modal xem hết review")
                                }
                            />
                        </div>
                    </div>
                )}

                <button className="complex-map-sidebar__btn"
                    onClick={() => {
                        if (!props?.slug)
                            return;

                        navigate(`/complexes/${props.slug}`);
                    }}
                >
                    Đặt sân ngay
                </button>
            </div>
        </aside>
    );
}

export default ComplexSidebar;
