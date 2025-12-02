"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
    // Only devices 29, 30, 31
    const deviceNumbers = [29, 30, 31];
    for (const i of deviceNumbers) {
      const deviceNum = String(i).padStart(3, "0");
      devices.push(`kanaria-test-${deviceNum}`);
    }
    return devices;
  };

  const fetchFiles = async (
    fromDate: string,
    toDate: string,
    fileType: "photos" | "json"
  ) => {
    if (!fromDate && !toDate) {
      alert("⚠️ Please select at least one date (From or To)");
      return;
    }

    if (fromDate && toDate && fromDate > toDate) {
      alert('⚠️ "From" date cannot be later than "To" date');
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
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      const data = await response.json();

      if (fileType === "photos") {
        setAllImages(data.files);
        setImageCount(`✅ Loaded ${data.files.length} images`);
      } else {
        setAllJSONFiles(data.files);
        setImageCount(`✅ Loaded ${data.files.length} JSON files`);
      }
    } catch (error: any) {
      console.error("Error fetching files:", error);
      alert("S3에서 파일을 가져오는데 실패했습니다.");
      setImageCount("❌ Error loading files");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShow = () => {
    fetchFiles(dateFrom, dateTo, activeCategory);
  };

  const handleRefresh = () => {
    if (!dateFrom && !dateTo) {
      alert("⚠️ Please select a date range first");
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
    setImageCount('📅 Select a date range and click "Show" to load files');
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
      alert("⚠️ No JSON files to download");
      return;
    }

    const totalFiles = allJSONFiles.length;
    const proceed = confirm(
      `📥 Download ${totalFiles} JSON files?\n\nFiles will be downloaded one by one. This may take a moment.`
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
      alert(`✅ Successfully downloaded all ${downloaded} files!`);
    } else {
      alert(
        `⚠️ Download completed:\n✅ ${downloaded} succeeded\n❌ ${failed} failed`
      );
    }
  };

  useEffect(() => {
    if (activeCategory === "photos" && allImages.length > 0) {
      if (searchTerm) {
        setImageCount(
          `🔍 Search results: ${filteredImages.length} of ${allImages.length} images`
        );
      } else {
        setImageCount(`✅ Loaded ${allImages.length} images`);
      }
    } else if (activeCategory === "json" && allJSONFiles.length > 0) {
      setImageCount(`✅ Loaded ${allJSONFiles.length} JSON files`);
    } else {
      setImageCount('📅 Select a date range and click "Show" to load files');
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
      if (e.key === "Escape" && modalImage) {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [modalImage]);

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
        <h1 style={{ margin: 0 }}>Reliability Test 📸</h1>
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

      {/* Category Tabs */}
      <div className="category-tabs">
        <button
          className={`category-tab ${
            activeCategory === "photos" ? "active" : ""
          }`}
          onClick={() => setActiveCategory("photos")}
        >
          📸 Photos
        </button>
        <button
          className={`category-tab ${
            activeCategory === "json" ? "active" : ""
          }`}
          onClick={() => setActiveCategory("json")}
        >
          📄 JSON Files
        </button>
      </div>

      {/* Device Selector */}
      <div className="controls" style={{ marginTop: "10px" }}>
        <label style={{ marginRight: "10px", fontWeight: 600 }}>
          🔧 Device:
        </label>
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
              {device === "all" ? "All devices (slower)" : device}
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
          {isLoading ? "Loading..." : "Show"}
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
                No images match your search
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
                  📥 Download All ({allJSONFiles.length} files)
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
                        Download
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>

      {/* Modal */}
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
    </>
  );
}
