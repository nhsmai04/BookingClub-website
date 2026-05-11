import React, { useEffect, useState } from 'react';
import { StarRating } from '../../components/common/StarRating/StarRating';
import './ReviewForm.css';

interface ReviewFormProps {
  onSubmit: (data: { rating: number; comment: string }) => void;
  onCancel: () => void;
  courtName: string; // Truyền tên sân vào để hiển thị cho thân thiện
  data?: {
    review_id: string;
    rating: number;
    comment: string;
  } | null;
  // Dữ liệu review đã có (nếu có) để hiển thị khi người dùng chỉnh sửa review của mình
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit, onCancel, courtName, data }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

   useEffect(() => {
    if (data) {
      setRating(data.rating);
      setComment(data.comment);
    }else
    {
      setRating(0);
      setComment("");
    }
  }, [data]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Vui lòng chọn số sao đánh giá!");
      return;
    }
    onSubmit({ rating, comment });
  };

  return (
    <div className="review-form-container">
      <div className="form-header">
        <h3>Đánh giá trải nghiệm</h3>
        <p className="sub-title">Bạn thấy chất lượng sân <strong>{courtName}</strong> thế nào?</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="rating-section">
          <StarRating rating={rating} onSelectStar={setRating} />
          <span className="rating-text">
           { rating > 0
              ? `${rating}/5 sao`
              : "Chọn số sao để đánh giá chất lượng sân!"
           }
          </span>
        </div>

        <div className="comment-section">
          <label htmlFor="comment">Nhận xét của bạn</label>  
            <textarea
            id="comment"
            placeholder="Chia sẻ thêm về mặt sân, ánh sáng, hoặc dịch vụ tại đây..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Hủy bỏ
          </button>
          <button type="submit" className="btn-submit-review">
            Gửi đánh giá
          </button>
        </div>
      </form>
    </div>
  );
};
