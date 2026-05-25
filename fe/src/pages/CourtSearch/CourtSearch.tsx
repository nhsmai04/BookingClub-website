import { useEffect, useState } from "react";
import SearchBar from "../../components/common/SearchBar/SearchBar";
import CourtSearchCard from "../../components/common/CourtSearchCard/CourtSearchCard";
import Pagination from "../../components/common/Pagination/Pagination";
import axios from "../../utils/axios.customize";
import "./CourtSearch.css";
import { MapPinned } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CourtItem {
  _id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  phone?: string;
  email?: string;
  slug?: string;
  [key: string]: any;
}


function CourtSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CourtItem[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 9;
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSport, setSelectedSport] = useState("");

  const mergeUniqueCourts = (groups: CourtItem[][]) => {
    const map = new Map<string, CourtItem>();

    groups.flat().forEach((court) => {
      if (!map.has(court._id)) {
        map.set(court._id, court);
      }
    });

    return Array.from(map.values());
  };

  const fetchCourts = async (keyword: string, targetPage: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const normalizedKeyword = keyword.trim();

      const hasFilter = selectedCity || selectedDistrict || selectedSport;

      // Chỉ gọi all khi KHÔNG có gì
      if (!normalizedKeyword && !hasFilter) {
        const response: any =
          await axios.get(
            "/api/v1/sportcomplex/all",
            {
              params: {
                page:
                  targetPage,
                limit:
                  pageSize
              }
            }
          );

        setResults(
          response.sportComplexes ||
          []
        );

        setTotalPages(
          response.pagination
            ?.totalPages || 0
        );

        setPage(targetPage);

        return;
      }

      //Khi có search
      const requestConfigs =
        normalizedKeyword
          ? [
            {
              keyword:
                normalizedKeyword
            }
          ]
          : [{}];

      const responses = await Promise.all(
        requestConfigs.map((params) =>
          axios.get("/api/v1/sportcomplex/search", {
            params: {
              ...params,
              city: selectedCity,
              district: selectedDistrict,
              fieldTypes: selectedSport,
              page: targetPage,
              limit: pageSize
            }
          })
        )
      );

      // axios.customize has a response interceptor that returns `response.data` directly,
      // so `responses` is actually an array of data objects at runtime. Use `any` here
      // to match runtime behavior and avoid TypeScript errors.
      const responseData = responses as any[];
      const mergedCourts = mergeUniqueCourts(responseData.map((response) => response.sportComplexes || []));
      const maxPages = Math.max(...responseData.map((response) => response.pagination?.totalPages || 0), 0);

      setResults(mergedCourts);
      setTotalPages(maxPages);
      setPage(targetPage);
    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.response?.data?.message || 'Tìm kiếm thất bại. Vui lòng thử lại.');
      setResults([]);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (nextQuery: string) => {
    setQuery(nextQuery);
    await fetchCourts(nextQuery, 1);
  };

  const handlePageChange = async (newPage: number) => {
    await fetchCourts(query, newPage);
  };

  useEffect(() => {
    fetchCourts("", 1);
  }, []);

  return (
    <main className="court-search-page">
      <header className="search-header">
        <div className="search-header-content">
          <div>
            <h1>Tìm kiếm sân</h1>
            <p>Tìm sân theo tên hoặc vị trí</p>
          </div>

          <button
            className="go-map-btn"
            onClick={() => navigate("/map")}
          >
            <MapPinned size={18} />
            Xem bản đồ
          </button>
        </div>
      </header>

      <SearchBar
        value={query}
        onChange={setQuery}
        onSearch={
          handleSearch
        }
        isLoading={
          isLoading
        }

        selectedCity={
          selectedCity
        }
        selectedDistrict={
          selectedDistrict
        }
        selectedSport={
          selectedSport
        }

        onCityChange={
          setSelectedCity
        }
        onDistrictChange={
          setSelectedDistrict
        }
        onSportChange={
          setSelectedSport
        }
      />

      {error && (
        <div className="error-message" style={{ padding: '20px', color: '#dc2626', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {isLoading && !results.length && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          Đang tìm kiếm...
        </div>
      )}

      {!isLoading && results.length === 0 && !error && query && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
          Không tìm thấy sân nào phù hợp
        </div>
      )}

      {!isLoading && results.length === 0 && !error && !query && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
          Nhập tên sân, từ khóa, thành phố, quận/huyện hoặc môn thể thao để tìm kiếm.
        </div>
      )}

      {results.length > 0 && (
        <section className="results">
          <div className="results-grid">
            {results.map((c) => (
              <CourtSearchCard key={c._id} court={c} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={handlePageChange}
            />
          )}
        </section>
      )}
    </main>
  );
}

export default CourtSearch;
