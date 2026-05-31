import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import "./CourtInfo.css"
import CourtGallery from "../../components/ui/CourtGallery/CourtGallery";
import OpeningHours from "../../components/common/OpeningHours/OpeningHours";
import BookingCard from "../../components/common/BookingCard/BookingCard";
import Review from "../../components/common/Review/Review"
import SubFieldList from "../../features/SubFieldList/SubFieldList";
import {getSportDetail, type SportComplexDetail, type SubFieldDetail} from "../../services/sportDetail.api";
import { type ReviewStats } from "../../types/review";
import { getReviewStats } from "../../services/review.api";
import { Navigation } from "lucide-react";

const CourtInfo = () => {
  const { slug } = useParams<{ slug: string }>();
  // Lưu trữ dữ liệu và trạng thái loading
  const [court, setCourt] = useState<SportComplexDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<string | undefined>(undefined);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      getSportDetail(slug)
        .then((data:SportComplexDetail) => {
          setCourt(data);
          if (data.subFields && data.subFields.length > 0) {
            setSelectedCourtId(data.subFields[0].id);
          }
          setLoading(false);
        })
        .catch((err:Error) => { 
          console.error("Lỗi", err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [slug]);

  // Lấy dữ liệu cho SubFieldList
  const normalizedSubFields = useMemo(() => {
      return court?.subFields.map((s:SubFieldDetail) => ({
        ...s,
        config_id: {
            field_type: s.sportType,
            base_price: s.basePrice,
            pricingRules: s.pricingRules
        }
    })) || [];
  }, [court]);

  const complexId = court?.id;

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

  // Xử lý các trạng thái 
  if (!slug) return <div>Đường dẫn không hợp lệ.</div>;
  if (loading) return <div className="loading">Đang tải thông tin sân...</div>;
  if (error) return <div className="error">Lỗi: {error}</div>;
  if (!court) return <div>Không tìm thấy thông tin sân.</div>;

  return (
    <main className="court-detail-container">
      <div className="court-left-section">
        <div className="court-gallery-wrapper">
          <CourtGallery
            images={court.images}
            courtName={court.name}
            ownerName={court.ownerName}
            priceRange={court.priceRange}
          />

          <div className="court-main-header">
            <div className="header-info">
              <h1 className="court-title-name">{court.name}</h1>
              <p className="court-location-address">{court.address}</p>
              {court.map_url && (
                <a
                  href={court.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="court-map-link"
                >
                  <Navigation size={16} />
                  <span>Xem chỉ đường</span>
                </a>
              )}
            </div>

            <div className="header-actions">
              <button className="action-btn" title="Yêu thích">❤️</button>
              <button className="action-btn" title="Chia sẻ">🔗</button>
            </div>
          </div>

          <section className="court-description-section">
            <h3 className="section-title">Mô tả sân</h3>
            <div className="description-text">
              <p>
                Sân cầu lông/pickleball tại Trung tâm Rạch Miễu được trang bị mặt thảm tiêu chuẩn thi đấu,
                hệ thống chiếu sáng chống chói và không gian thoáng đãng. Đây là địa điểm lý tưởng
                cho các giải đấu phong trào và tập luyện nâng cao sức khỏe.
              </p>
              <p>
                Vị trí thuận tiện ngay trung tâm quận Phú Nhuận, bãi đậu xe rộng rãi và khu vực
                nghỉ ngơi sạch sẽ cho vận động viên.
              </p>
            </div>
          </section>

          <section className="court-amenities-section">
            <h3 className="section-title">Dịch vụ</h3>
            <div className="amenities-grid">
              <div className="amenity-item">🍴 Kitchen</div>
              <div className="amenity-item">📶 Free Wireless Internet</div>
              <div className="amenity-item">📺 Television with Netflix</div>
              <div className="amenity-item">❄️ Air Conditioner</div>
              <div className="amenity-item">🌅 Balcony or Patio</div>
              <div className="amenity-item">🧺 Washer</div>
            </div>
          </section>

          <section className="court-amenities-section">
            <h3 className="section-title">Tiện nghi</h3>
            <div className="amenities-grid">
              <div className="amenity-item">📋 Daily Cleaning</div>
              <div className="amenity-item">🛡️ Disinfections and Sterilizations</div>
              <div className="amenity-item">🧯 Fire Extinguishers</div>
              <div className="amenity-item">🔔 Smoke Detectors</div>
            </div>
          </section>

          <section className="court-subfield-info">
            <SubFieldList dataSource={normalizedSubFields} />
          </section>

          <section className="court-reviews-wrapper">
            <Review
              overallRating={reviewStats?.avgRating || 0}
              totalReviews={reviewStats?.totalReviews || 0}
              reviews={reviewStats?.reviews || []}
              onShowAllClick={() =>
                  console.log("Mở modal xem hết review")
              }
            />
          </section>
        </div>
      </div>

      <div className="court-right-section">
        <OpeningHours
          openTime={court.openTime}
          closeTime={court.closeTime}
        />
        <BookingCard
          complexId={court.id}
          complexName={court.name}
          courtsList={court.subFields} 
          courtId={selectedCourtId}
          onClearSelection={() => setSelectedCourtId(undefined)}
        />
      </div>
    </main>
  );
};

export default CourtInfo;
