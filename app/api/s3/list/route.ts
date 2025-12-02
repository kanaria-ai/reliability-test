import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';

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
    const { fromDate, toDate, selectedDevice, fileType } = body;

    if (!fromDate && !toDate) {
      return NextResponse.json(
        { error: 'Please select at least one date' },
        { status: 400 }
      );
    }

    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'kanaria-prototype-test';

    // Generate date prefixes
    const prefixes = generateDatePrefixes(fromDate, toDate, selectedDevice, fileType);

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
              return file.Key?.match(/\.json$/i);
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
  fileType: string = 'photos'
): string[] {
  const prefixes: string[] = [];

  // Generate device list
  let devices: string[] = [];
  if (selectedDevice === 'all') {
    // Only devices 29, 30, 31
    const deviceNumbers = [29, 30, 31];
    for (const i of deviceNumbers) {
      const deviceNum = String(i).padStart(3, '0');
      devices.push(`kanaria-test-${deviceNum}`);
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
  const prefixBase = fileType === 'json' ? 'upload_info_' : '';

  for (const device of devices) {
    for (const date of dates) {
      prefixes.push(`${prefixBase}${device}_${date}`);
    }
  }

  return prefixes;
}

