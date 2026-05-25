import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getFeaturedCourtsApi,
  type FeaturedCourtItem,
} from "../../../services/home.api";

import "./FeaturedCourtsSection.css";

const tabs = [
  "Tất cả",
  "Đề xuất",
  "Phổ biến",
  "Gần đây",
];

const tabToApiTab: Record<string, string> = {
  "Tất cả": "all",
  "Đề xuất": "recommended",
  "Phổ biến": "popular",
  "Gần đây": "recent",
};

const sportLabels: Record<string, string> = {
  badminton: "Cầu lông",
  football: "Bóng đá",
  tennis: "Tennis",
  basketball: "Bóng rổ",
  volleyball: "Bóng chuyền",
  pickleball: "Pickleball",
  padel: "Padel",
  golf: "Golf",
  complex: "Sân tổng hợp",
};

const emptyMessages: Record<string, string> = {
  "Tất cả": "Chưa có sân nổi bật để hiển thị.",
  "Đề xuất": "Chưa có sân đủ dữ liệu đánh giá.",
  "Phổ biến": "Chưa có sân nổi bật để hiển thị.",
  "Gần đây": "Chưa có lịch sử đặt sân gần đây. Hãy đăng nhập để khám phá thêm.",
};

function FeaturedCourtsSection() {
  const [activeTab, setActiveTab] =
    useState("Tất cả");
  const [courts, setCourts] = useState<FeaturedCourtItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadFeaturedCourts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getFeaturedCourtsApi(
          tabToApiTab[activeTab] || "all"
        );

        if (isMounted) {
          setCourts(response.items || []);
        }
      } catch (loadError) {
        if (isMounted) {
          setCourts([]);
          setError("Không tải được sân nổi bật. Vui lòng thử lại.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFeaturedCourts();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  return (
    <section className="featured-section">
      <div className="section-header">
        <h2>Sân nổi bật</h2>

        <p>
          Khám phá các sân thể thao chất lượng
          cao.
        </p>
      </div>

      <div className="court-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={
              activeTab === tab ? "active" : ""
            }
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ textAlign: "center", color: "#b91c1c", marginBottom: 24 }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: "center", color: "#6b7280", minHeight: 180 }}>
          Đang tải sân nổi bật...
        </div>
      ) : courts.length === 0 ? (
        <div style={{ textAlign: "center", color: "#6b7280", minHeight: 180 }}>
          {emptyMessages[activeTab]}
        </div>
      ) : (
        <div className="courts-grid">
          {courts.map((court) => (
            <div
              className="court-card"
              key={court._id}
            >
              <div className="court-image">
                <img
                  src={court.image_url || `https://via.placeholder.com/600x400?text=${encodeURIComponent(court.name)}`}
                  alt={court.image_alt || court.name}
                />
              </div>

              <div className="court-content">
                <span className="court-sport">
                  {sportLabels[court.sport_type] || court.sport_type}
                </span>

                <h3>{court.name}</h3>

                <p>{court.district}{court.city ? ` • ${court.city}` : ""}</p>

                <div className="court-bottom">
                  <strong>{court.price_display}</strong>

                  <button
                    onClick={() =>
                      navigate(`/complexes/${court.slug}`)
                    }
                  >
                    Đặt ngay
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
{/* 
      <div className="view-more-wrapper">
        <button className="view-more-btn">
          Xem thêm
        </button>
      </div> */}
    </section>
  );
}

export default FeaturedCourtsSection;
