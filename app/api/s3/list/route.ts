import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import { NORMAL_MODE_DEVICES, ADMIN_MODE_DEVICE_RANGE } from '../../../config/constants';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromDate, toDate, selectedDevice, fileType, isAdminMode } = body;

    if (!fromDate && !toDate) {
      return NextResponse.json(
        { error: 'Please select at least one date' },
        { status: 400 }
      );
    }

    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'kanaria-prototype-test';

    // Generate date prefixes
    const prefixes = generateDatePrefixes(fromDate, toDate, selectedDevice, fileType, isAdminMode);

    let allFiles: any[] = [];

    // Process each prefix
    for (const prefix of prefixes) {
      let continuationToken: string | undefined = undefined;

      do {
        const command: ListObjectsV2Command = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix,
          MaxKeys: 1000,
          ContinuationToken: continuationToken,
        });

        const response: ListObjectsV2CommandOutput = await s3Client.send(command);

        if (response.Contents && response.Contents.length > 0) {
          // Filter files by type
          const files = response.Contents.filter((file: any) => {
            if (fileType === 'photos') {
              return file.Key?.match(/\.(jpg|jpeg|png|gif)$/i);
            } else {
              // JSON files can be .json or .txt (log folder files)
              return file.Key?.match(/\.(json|txt)$/i);
            }
          });

          allFiles = allFiles.concat(
            files.map((file: any) => ({
              Key: file.Key,
              Size: file.Size,
              LastModified: file.LastModified?.toISOString(),
            }))
          );
        }

        continuationToken = response.NextContinuationToken;

        // Safety limit
        if (allFiles.length > 10000) {
          break;
        }
      } while (continuationToken);
    }

    // Sort by LastModified (newest first)
    allFiles.sort((a, b) => {
      const dateA = new Date(a.LastModified || 0).getTime();
      const dateB = new Date(b.LastModified || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ files: allFiles });
  } catch (error: any) {
    console.error('S3 Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch files from S3' },
      { status: 500 }
    );
  }
}

function generateDatePrefixes(
  fromDate: string | null,
  toDate: string | null,
  selectedDevice: string,
  fileType: string = 'photos',
  isAdminMode: boolean = false
): string[] {
  const prefixes: string[] = [];

  // Generate device list
  let devices: string[] = [];
  if (selectedDevice === 'all') {
    if (isAdminMode) {
      // Admin mode: devices 001 to 031
      for (let i = ADMIN_MODE_DEVICE_RANGE.START; i <= ADMIN_MODE_DEVICE_RANGE.END; i++) {
        const deviceNum = String(i).padStart(3, '0');
        devices.push(`kanaria-test-${deviceNum}`);
      }
    } else {
      // Normal mode: Only devices 29, 30, 31
      for (const i of NORMAL_MODE_DEVICES) {
        const deviceNum = String(i).padStart(3, '0');
        devices.push(`kanaria-test-${deviceNum}`);
      }
    }
  } else {
    devices.push(selectedDevice);
  }

  // Generate date list
  const dates: string[] = [];

  if (fromDate && !toDate) {
    const dateStr = fromDate.replace(/-/g, '');
    dates.push(dateStr);
  } else if (!fromDate && toDate) {
    const dateStr = toDate.replace(/-/g, '');
    dates.push(dateStr);
  } else if (fromDate && toDate) {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const current = new Date(start);

    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;
      dates.push(dateStr);
      current.setDate(current.getDate() + 1);
    }
  }

  // Generate prefixes
  if (fileType === 'json') {
    // JSON files can be in two locations:
    // 1. upload_info_${device}_${date} (root level, .json files)
    // 2. log/upload_info_${deviceNumber}_${date} (log folder, .txt files like upload_info_031_20260205_143014.txt)
    //    Note: log folder uses device number only (e.g., 031) without "kanaria-test-" prefix
    for (const device of devices) {
      // Extract device number from device string (e.g., "kanaria-test-031" -> "031")
      const deviceMatch = device.match(/(\d{3})$/);
      const deviceNumber = deviceMatch ? deviceMatch[1] : device.replace('kanaria-test-', '');
      
      for (const date of dates) {
        // Original location: upload_info_kanaria-test-031_20260205
        prefixes.push(`upload_info_${device}_${date}`);
        // Log folder location: log/upload_info_031_20260205 (device number only)
        prefixes.push(`log/upload_info_${deviceNumber}_${date}`);
      }
    }
  } else {
    // Photos: just device_date pattern
    for (const device of devices) {
      for (const date of dates) {
        prefixes.push(`${device}_${date}`);
      }
    }
  }

  return prefixes;
}

