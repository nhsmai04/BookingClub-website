import React, { useState } from "react";
import "./SearchBar.css";

interface Props {
  value: string;
  onChange: (
    value: string
  ) => void;

  onSearch: (
    keyword: string
  ) => void;

  isLoading?: boolean;

  selectedCity: string;
  selectedDistrict: string;
  selectedSport: string;

  onCityChange: (
    city: string
  ) => void;

  onDistrictChange: (
    district: string
  ) => void;

  onSportChange: (
    sport: string
  ) => void;
}

type Option = {
  label: string;
  value: string;
};

const SearchBar: React.FC<Props> = ({
  value,
  onChange,
  onSearch,
  isLoading = false,

  selectedCity,
  selectedDistrict,
  selectedSport,

  onCityChange,
  onDistrictChange,
  onSportChange
}) => {
  const cityDistrictMap: Record<string, Option[]> = {
    TPHCM: [
      // { label: "Quận 1", value: "quan 1" },
      { label: "Quận 2", value: "quan 2" },
      // { label: "Quận 4", value: "quan 4" },
      // { label: "Quận 5", value: "quan 5" },
      // { label: "Quận 6", value: "quan 6" },
      { label: "Quận 7", value: "quan 7" },
      { label: "Quận 8", value: "quan 8" },
      { label: "Quận 10", value: "quan 10" },
      { label: "Quận 11", value: "quan 11" },
      // { label: "Quận 12", value: "quan 12" },

      // { label: "Bình Tân", value: "binh tan" },
      { label: "Bình Thạnh", value: "binh thanh" },
      // { label: "Gò Vấp", value: "go vap" },
      { label: "Phú Nhuận", value: "phu nhuan" },
      { label: "Tân Bình", value: "tan binh" },
      // { label: "Tân Phú", value: "tan phu" },

      // { label: "Thủ Đức", value: "thu duc" },

      // { label: "Bình Chánh", value: "binh chanh" },
      // { label: "Huyện Cần Giờ", value: "can gio" },
      // { label: "Huyện Củ Chi", value: "cu chi" },
      // { label: "Huyện Hóc Môn", value: "hoc mon" },
      // { label: "Huyện Nhà Bè", value: "nha be" }
    ],
    "Cần Thơ": [
      { label: "Ninh Kiều", value: "ninh-kieu" },
      { label: "Cái Răng", value: "cai-rang" },
      { label: "Bình Thủy", value: "binh-thuy" }
    ]
  };

  const districtOptions = cityDistrictMap[selectedCity] || [];

  const sportOptions = [
    {
      value: "football",
      label: "Bóng đá"
    },
    {
      value: "badminton",
      label: "Cầu lông"
    },
    {
      value: "tennis",
      label: "Tennis"
    },
    {
      value: "basketball",
      label: "Bóng rổ"
    },
    {
      value: "volleyball",
      label: "Bóng chuyền"
    },
    {
      value: "pickleball",
      label: "Pickleball"
    },
    {
      value: "padel",
      label: "Padel"
    },
    {
      value: "golf",
      label: "Golf"
    }
  ];
  const handleSearch = () => {
    onSearch(value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="searchbar-wrapper">
      <div className="searchbar__filters">

        <div className="searchbar__filter">
          <select
            className="searchbar__select"
            value={selectedCity}
            onChange={(e) => {
              onCityChange(e.target.value);
              onDistrictChange("");
            }}
          >
            <option value="">
              Thành phố
            </option>

            {Object.keys(cityDistrictMap).map((city) => (
              <option
                key={city}
                value={city}
              >
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="searchbar__filter">
          <select
            className="searchbar__select"
            value={selectedDistrict}
            onChange={(e) =>
              onDistrictChange(e.target.value)
            }
            disabled={!selectedCity}
          >
            <option value="">
              Quận/Huyện
            </option>

            {districtOptions.map((district) => (
              <option
                key={district.value}
                value={district.value}
              >
                {district.label}
              </option>
            ))}
          </select>
        </div>

        <div className="searchbar__filter">
          <select
            className="searchbar__select"
            value={selectedSport}
            onChange={(e) =>
              onSportChange(e.target.value)
            }
          >
            <option value="">
              Môn thể thao
            </option>

            {sportOptions.map((sport) => (
              <option
                key={sport.value}
                value={sport.value}
              >
                {sport.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <input
        className="searchbar__input"
        placeholder="Tìm theo tên sân..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyPress}
        aria-label="Search courts"
        disabled={isLoading}
      />

      <button
        className="searchbar__button"
        onClick={handleSearch}
        disabled={isLoading}
      >
        {isLoading ? "Đang tìm..." : "Tìm"}
      </button>
    </div>
  );
};

export default SearchBar;
