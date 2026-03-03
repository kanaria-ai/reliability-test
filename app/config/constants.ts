/**
 * 일반 모드에서 접근 가능한 기기 번호 목록
 */
export const NORMAL_MODE_DEVICES = [1, 4, 29, 30, 31] as const;

/**
 * 관리자 모드에서 접근 가능한 기기 번호 범위
 */
export const ADMIN_MODE_DEVICE_RANGE = {
  START: 1,
  END: 37,
} as const;
