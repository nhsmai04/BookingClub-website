import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Eye,
  MapPinned,
} from "lucide-react";

import { featuredCourt } from "../mockData";

import "./HeroSection.css";
import {
  getFeaturedCourtsApi,
  type FeaturedCourtItem,
} from "../../../services/home.api";

function HeroSection() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [courts, setCourts] = useState<FeaturedCourtItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadFeaturedCourts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getFeaturedCourtsApi("all");

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
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-left">
          <span className="hero-tag">
            Booking sân thể thao dễ dàng
          </span>

          <h1>
            ĐẶT SÂN NHANH CHÓNG
            <br />
            TRẢI NGHIỆM CHUYÊN NGHIỆP
          </h1>

          <p>
            Tìm kiếm và đặt sân thể thao yêu thích
            chỉ trong vài phút.
          </p>

          <div className="hero-buttons">
            <button
              className="hero-primary-btn"
              onClick={() =>
                navigate(
                  `/complexes/${courts[0]?.slug}`
                )
              }
            >
              <CalendarDays size={18} /> Đặt sân ngay
            </button>

            <button
              className="hero-secondary-btn"
              onClick={() =>
                navigate(`/complexes/search`)
              }
            >
              <Eye size={18} /> Xem thêm sân
            </button>
            <button
              className="hero-secondary-btn hero-map-btn"
              onClick={() => navigate("/map")}
            >
              <MapPinned size={18} /> Xem bản đồ
            </button>
          </div>
        </div>

        <div className="hero-right">
          <img
            src={courts[0]?.image_url || "https://images.unsplash.com/photo-1661749711934-492cd19a25c3?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
            alt={courts[0]?.image_alt || "img"}
          />

          <div className="hero-court-info">
            <h3>{courts[0]?.name}</h3>

            <p>{courts[0]?.address}</p>
          </div>
        </div>
      </div>

      <div className="hero-search">

      </div>
    </section>
  );
}

export default HeroSection;
