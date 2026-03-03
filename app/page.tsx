"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NORMAL_MODE_DEVICES, ADMIN_MODE_DEVICE_RANGE } from "./config/constants";

interface S3File {
  Key: string;
  Size: number;
  LastModified: string;
}

export default function Home() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<"photos" | "json">(
    "photos"
  );
  const [allImages, setAllImages] = useState<S3File[]>([]);
  const [allJSONFiles, setAllJSONFiles] = useState<S3File[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalInfo, setModalInfo] = useState<string>("");
  const [imageCount, setImageCount] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  const bucketName =
    process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || "kanaria-prototype-test";
  const bucketRegion = process.env.NEXT_PUBLIC_AWS_REGION || "ap-northeast-2";

  useEffect(() => {
    // Set today's date as default "To" date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    setDateTo(`${year}-${month}-${day}`);
  }, []);

  const generateDeviceList = () => {
    const devices = ["all"];

    if (isAdminMode) {
      // Admin mode: devices 001 to 031
      for (let i = ADMIN_MODE_DEVICE_RANGE.START; i <= ADMIN_MODE_DEVICE_RANGE.END; i++) {
        const deviceNum = String(i).padStart(3, "0");
        devices.push(`kanaria-test-${deviceNum}`);
      }
    } else {
      // Normal mode: Only devices 29, 30, 31
      for (const i of NORMAL_MODE_DEVICES) {
        const deviceNum = String(i).padStart(3, "0");
        devices.push(`kanaria-test-${deviceNum}`);
      }
    }

    return devices;
  };

  const handleAdminLogin = () => {
    setShowAdminModal(true);
    setAdminPassword("");
    setAdminError("");
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");

    if (adminPassword === "kanaria123") {
      setIsAdminMode(true);
      setShowAdminModal(false);
      setAdminPassword("");
      setSelectedDevice("all"); // Reset to all devices
    } else {
      setAdminError("비밀번호가 올바르지 않습니다.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminMode(false);
    setSelectedDevice("all"); // Reset to all devices
  };

  const fetchFiles = async (
    fromDate: string,
    toDate: string,
    fileType: "photos" | "json"
  ) => {
    if (!fromDate && !toDate) {
      alert("⚠️ 최소한 하나의 날짜(시작일 또는 종료일)를 선택해주세요");
      return;
    }

    if (fromDate && toDate && fromDate > toDate) {
      alert("⚠️ 시작일은 종료일보다 늦을 수 없습니다");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/s3/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromDate,
          toDate,
          selectedDevice,
          fileType,
          isAdminMode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      const data = await response.json();

      if (fileType === "photos") {
        setAllImages(data.files);
        setImageCount(`✅ ${data.files.length}개의 이미지를 불러왔습니다`);
      } else {
        setAllJSONFiles(data.files);
        setImageCount(`✅ ${data.files.length}개의 JSON 파일을 불러왔습니다`);
      }
    } catch (error: any) {
      console.error("Error fetching files:", error);
      alert("S3에서 파일을 가져오는데 실패했습니다.");
      setImageCount("❌ 파일 불러오기 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShow = () => {
    fetchFiles(dateFrom, dateTo, activeCategory);
  };

  const handleRefresh = () => {
    if (!dateFrom && !dateTo) {
      alert("⚠️ 먼저 날짜 범위를 선택해주세요");
      return;
    }
    fetchFiles(dateFrom, dateTo, activeCategory);
  };

  const handleDateReset = () => {
    setDateFrom("");
    setDateTo("");
    setAllImages([]);
    setAllJSONFiles([]);
    setSearchTerm("");
    setImageCount('📅 날짜 범위를 선택하고 "조회하기"를 클릭하세요');
  };

  const filteredImages = searchTerm
    ? allImages.filter((file) =>
        file.Key.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allImages;

  const openModal = (file: S3File) => {
    const imageUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${file.Key}`;
    setModalImage(imageUrl);

    const modalDate = new Date(file.LastModified).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const fileSize = (file.Size / 1024 / 1024).toFixed(2);

    setModalInfo(`
      <div><strong>파일명:</strong> ${file.Key.split("/").pop()}</div>
      <div><strong>크기:</strong> ${fileSize} MB</div>
      <div><strong>업로드 시간:</strong> ${modalDate}</div>
    `);
  };

  const closeModal = () => {
    setModalImage(null);
    setModalInfo("");
  };

  const downloadFile = (fileKey: string) => {
    const fileUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${fileKey}`;
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileKey.split("/").pop() || "";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllJSONFiles = async () => {
    if (allJSONFiles.length === 0) {
      alert("⚠️ 다운로드할 JSON 파일이 없습니다");
      return;
    }

    const totalFiles = allJSONFiles.length;
    const proceed = confirm(
      `📥 ${totalFiles}개의 JSON 파일을 다운로드하시겠습니까?\n\n파일은 하나씩 다운로드됩니다. 시간이 걸릴 수 있습니다.`
    );

    if (!proceed) return;

    let downloaded = 0;
    let failed = 0;

    for (let i = 0; i < allJSONFiles.length; i++) {
      const file = allJSONFiles[i];
      try {
        downloadFile(file.Key);
        downloaded++;
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (err) {
        failed++;
        console.error(`Failed: ${file.Key}`, err);
      }
    }

    if (failed === 0) {
      alert(`✅ 모든 ${downloaded}개 파일을 성공적으로 다운로드했습니다!`);
    } else {
      alert(`⚠️ 다운로드 완료:\n✅ ${downloaded}개 성공\n❌ ${failed}개 실패`);
    }
  };

  useEffect(() => {
    if (activeCategory === "photos" && allImages.length > 0) {
      if (searchTerm) {
        setImageCount(
          `🔍 검색 결과: ${allImages.length}개 중 ${filteredImages.length}개 이미지`
        );
      } else {
        setImageCount(`✅ ${allImages.length}개의 이미지를 불러왔습니다`);
      }
    } else if (activeCategory === "json" && allJSONFiles.length > 0) {
      setImageCount(`✅ ${allJSONFiles.length}개의 JSON 파일을 불러왔습니다`);
    } else {
      setImageCount('📅 날짜 범위를 선택하고 "조회하기"를 클릭하세요');
    }
  }, [
    activeCategory,
    allImages,
    allJSONFiles,
    searchTerm,
    filteredImages.length,
  ]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (modalImage) {
          closeModal();
        } else if (showAdminModal) {
          setShowAdminModal(false);
          setAdminPassword("");
          setAdminError("");
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [modalImage, showAdminModal]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ margin: 0 }}>
          카나리아 테스트 뷰어
          {isAdminMode && (
            <span
              style={{
                marginLeft: "10px",
                fontSize: "14px",
                color: "#4CAF50",
                fontWeight: 600,
              }}
            >
              [관리자 모드]
            </span>
          )}
        </h1>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {isAdminMode ? (
            <button
              onClick={handleAdminLogout}
              style={{
                padding: "8px 16px",
                backgroundColor: "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              관리자 모드 종료
            </button>
          ) : (
            <button
              onClick={handleAdminLogin}
              style={{
                padding: "8px 16px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              관리자 모드
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px",
              backgroundColor: "#666",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        <button
          className={`category-tab ${
            activeCategory === "photos" ? "active" : ""
          }`}
          onClick={() => setActiveCategory("photos")}
        >
          📸 사진
        </button>
        <button
          className={`category-tab ${
            activeCategory === "json" ? "active" : ""
          }`}
          onClick={() => setActiveCategory("json")}
        >
          📄 JSON 파일
        </button>
      </div>

      {/* Device Selector */}
      <div className="controls" style={{ marginTop: "10px" }}>
        <label style={{ marginRight: "10px", fontWeight: 600 }}>🔧 장치:</label>
        <select
          id="device-selector"
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          style={{
            padding: "8px 15px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            fontSize: "14px",
            minWidth: "200px",
          }}
        >
          {generateDeviceList().map((device) => (
            <option key={device} value={device}>
              {device === "all" ? "모든 장치 (느림)" : device}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range Selector */}
      <div className="controls" style={{ marginTop: "10px" }}>
        <label style={{ marginRight: "10px", fontWeight: 600 }}>
          📅 날짜 범위 선택:
        </label>
        <input
          type="date"
          id="date-from"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          style={{
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            fontSize: "14px",
            cursor: "pointer",
            position: "relative",
            zIndex: 1,
          }}
        />
        <span style={{ margin: "0 10px" }}>~</span>
        <input
          type="date"
          id="date-to"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          style={{
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            fontSize: "14px",
            cursor: "pointer",
            position: "relative",
            zIndex: 1,
          }}
        />
        <button
          id="show-btn"
          onClick={handleShow}
          disabled={isLoading}
          style={{
            marginLeft: "10px",
            padding: "10px 30px",
            backgroundColor: isLoading ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          {isLoading ? "로딩 중..." : "조회하기"}
        </button>
        <button
          id="date-reset-btn"
          onClick={handleDateReset}
          style={{
            marginLeft: "5px",
            padding: "8px 15px",
            backgroundColor: "#666",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          초기화
        </button>
      </div>

      {/* Search and Refresh */}
      <div className="controls" style={{ marginTop: "10px" }}>
        <input
          type="text"
          id="search-box"
          className="search-box"
          placeholder="파일명으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={activeCategory === "json" || allImages.length === 0}
        />
        <button
          id="refresh-btn"
          className="refresh-btn"
          onClick={handleRefresh}
          disabled={isLoading || (!dateFrom && !dateTo)}
        >
          새로고침
        </button>
      </div>

      <div
        id="image-count"
        style={{ textAlign: "center", margin: "10px 0", color: "#666" }}
      >
        {imageCount}
      </div>

      {/* Image Container */}
      <div
        id="image-container"
        className={
          activeCategory === "photos" && filteredImages.length === 0
            ? "centered"
            : ""
        }
        style={{ display: activeCategory === "photos" ? "grid" : "none" }}
      >
        {activeCategory === "photos" && (
          <>
            {allImages.length === 0 ? (
              <div className="centered-message"></div>
            ) : filteredImages.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: "40px", color: "#999" }}
              >
                검색 결과가 없습니다
              </div>
            ) : (
              filteredImages.map((file) => {
                const imageUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${file.Key}`;
                const date = new Date(file.LastModified).toLocaleString(
                  "ko-KR",
                  {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }
                );

                return (
                  <div
                    key={file.Key}
                    className="image-card"
                    onClick={() => openModal(file)}
                  >
                    <img src={imageUrl} alt={file.Key} loading="lazy" />
                    <div className="image-info">
                      <div className="image-date">{date}</div>
                      <div className="image-name">
                        {file.Key.split("/").pop()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* JSON Container */}
      <div
        id="json-container"
        className={activeCategory === "json" ? "active" : ""}
        style={{ display: activeCategory === "json" ? "block" : "none" }}
      >
        {activeCategory === "json" && (
          <>
            {allJSONFiles.length === 0 ? (
              <div className="centered-message"></div>
            ) : (
              <>
                <button
                  className="download-all-btn"
                  onClick={downloadAllJSONFiles}
                >
                  📥 전체 다운로드 ({allJSONFiles.length}개 파일)
                </button>
                {allJSONFiles.map((file) => {
                  const fileSize = (file.Size / 1024).toFixed(2);
                  const fileDate = new Date(file.LastModified).toLocaleString(
                    "ko-KR",
                    {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );

                  return (
                    <div key={file.Key} className="json-file-item">
                      <div className="json-file-name">{file.Key}</div>
                      <div className="json-file-info">
                        {fileSize} KB | {fileDate}
                      </div>
                      <button
                        className="download-btn"
                        onClick={() => downloadFile(file.Key)}
                      >
                        다운로드
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>

      {/* Image Modal */}
      {modalImage && (
        <div className="modal active" onClick={closeModal}>
          <span className="close-btn" onClick={closeModal}>
            &times;
          </span>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              className="modal-image"
              src={modalImage}
              alt=""
              onClick={(e) => e.stopPropagation()}
            />
            <div
              className="modal-info"
              dangerouslySetInnerHTML={{ __html: modalInfo }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Admin Mode Password Modal */}
      {showAdminModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
          onClick={() => {
            setShowAdminModal(false);
            setAdminPassword("");
            setAdminError("");
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "40px",
              borderRadius: "10px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              width: "100%",
              maxWidth: "400px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                textAlign: "center",
                marginBottom: "30px",
                color: "#333",
                fontSize: "24px",
              }}
            >
              🔐 관리자 모드
            </h2>

            <form onSubmit={handleAdminSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="admin-password"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 600,
                    color: "#555",
                  }}
                >
                  비밀번호
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setAdminError("");
                  }}
                  required
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                  }}
                  placeholder="관리자 비밀번호를 입력하세요"
                />
              </div>

              {adminError && (
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#fee",
                    color: "#c33",
                    borderRadius: "5px",
                    marginBottom: "20px",
                    fontSize: "14px",
                  }}
                >
                  {adminError}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminModal(false);
                    setAdminPassword("");
                    setAdminError("");
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#ccc",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#2196F3",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  확인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
