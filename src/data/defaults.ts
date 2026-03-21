import type { FixedRole, VariableRole, SeatingConfig, BingoQuestion } from '../store'

export const defaultFixedRoles: FixedRole[] = [
  { name: '회장', description: '즐겁고 평화로운 학급 분위기 조성/ 학급회의 주도하기/ 담임선생님 도와주기/일정 칠판에 안내/ 유인물 관리 등' },
  { name: '부회장', description: '즐겁고 평화로운 학급 분위기 조성/ 학급회의 주도하기/ 담임선생님 도와주기/일정 칠판에 안내/ 유인물 관리 등' },
  { name: '정보부장', description: '디벗 배포 및 관리' },
]

export const defaultVariableRoles: VariableRole[] = [
  { name: '지각 체커', description: '지각생 칠판 앞에 예쁜 글씨로 적기 (8시 30분 이후 들어온 친구 이름 적기)' },
  { name: '학급 운영매니저', description: '출석부에 선생님께서 사인 안하셨을 시 체크해놓기, 싸인받아오기(1,2,3 교시)' },
  { name: '학급 운영매니저', description: '출석부에 선생님께서 사인 안하셨을 시 체크해놓기, 싸인받아오기(4,5,6 교시)' },
  { name: '칠판 클리너', description: '쉬는시간 칠판지우기 및 종례 전 전자칠판 끄기' },
  { name: '면학부장', description: '수행평가 (과목별 수행과제/마감 날짜), 준비물 칠판에 적기' },
  { name: '교실 가드', description: '이동수업 시 문닫고 나오기' },
  { name: '유인물체커', description: '점심시간 또는 오후 쉬는 시간에 1학년 학급함에 유인물 있는지 확인하고 있으면 가져와서 선생님 책상에 놓기' },
  { name: '교실정비가', description: '수시로 공용공간정리, 때때로 창문열어 환기시켜주기' },
  { name: '클린패스1', description: '주변에 쓰레기가 있는지 확인하는 친구(1,2줄)' },
  { name: '클린패스2', description: '주변에 쓰레기가 있는지 확인하는 친구(3,4줄)' },
  { name: '클린패스3', description: '주변에 쓰레기가 있는지 확인하는 친구(5,6 줄)' },
  { name: '클린대장1', description: '종례시간 전 주변에 쓰레기가 있는지 사물함이나 공용공간에 물건이 있는지 확인하는 친구(앞쪽 및 선생님 교탁 쓰레기 줍고 정리)' },
  { name: '클린대장2', description: '종례시간 전 주변에 쓰레기가 있는지 사물함이나 공용공간에 물건이 있는지 확인하는 친구(뒤쪽 쓰레기 줍고 정리, 사물함 위 체크)' },
]

export const defaultSeating: SeatingConfig = {
  rows: 7, cols: 5,
  disabled: [],
  fixed: {},
  distanced: [],
}

export const defaultBingoQuestions: BingoQuestion[] = [
  { emoji: '🫣', prompt: '이름도 모르고 아직 말 안 해본 친구', difficulty: 'hard', required: true },
  { emoji: '👀', prompt: '아직 눈 안 마주쳐본 친구', difficulty: 'hard', required: true },
  { emoji: '🏫', prompt: '다른 초등학교 나온 친구', difficulty: 'medium', required: true },
  { emoji: '🤔', prompt: '이름은 아는데 말해본 적 없는 친구', difficulty: 'hard', required: true },
  { emoji: '❓', prompt: '지금은 안친한데 친해지고 싶은 친구', difficulty: 'hard', required: true },
  { emoji: '🎮', prompt: '게임 좋아하는 친구', difficulty: 'easy' },
  { emoji: '🍰', prompt: '단 거 좋아하는 친구', difficulty: 'easy' },
  { emoji: '🌶️', prompt: '매운 거 잘 먹는 친구', difficulty: 'easy' },
  { emoji: '🌙', prompt: '밤 12시 이후에 자는 친구', difficulty: 'easy' },
  { emoji: '🐶', prompt: '강아지 좋아하는 친구', difficulty: 'easy' },
  { emoji: '🐱', prompt: '고양이 좋아하는 친구', difficulty: 'easy' },
  { emoji: '🍚', prompt: '아침 밥 먹고 온 친구', difficulty: 'easy' },
  { emoji: '🍗', prompt: '피자보다 치킨 좋아하는 친구', difficulty: 'easy' },
  { emoji: '⚽', prompt: '운동 좋아하는 친구', difficulty: 'medium' },
  { emoji: '🐾', prompt: '반려동물 키우는 친구', difficulty: 'medium' },
  { emoji: '🎧', prompt: '음악 듣는 게 취미인 친구', difficulty: 'medium' },
  { emoji: '🎨', prompt: '그림 그리는 거 좋아하는 친구', difficulty: 'medium' },
  { emoji: '💭', prompt: '꿈을 자주 꾸는 친구', difficulty: 'medium' },
  { emoji: '🔑', prompt: '방탈출 해본 적 있는 친구', difficulty: 'medium' },
  { emoji: '📖', prompt: '책 읽기 좋아하는 친구', difficulty: 'medium' },
  { emoji: '🌿', prompt: '고수 먹을 수 있는 친구', difficulty: 'hard' },
  { emoji: '🍳', prompt: '요리 해본 적 있는 친구', difficulty: 'hard' },
  { emoji: '💃', prompt: '춤 배워본 적 있는 친구', difficulty: 'hard' },
  { emoji: '👓', prompt: '안경 쓴 친구', difficulty: 'hard' },
  { emoji: '🎹', prompt: '악기 두 개 이상 다루는 친구', difficulty: 'hard' },
  { emoji: '🍜', prompt: '라면 끓일 줄 아는 친구', difficulty: 'medium' },
  { emoji: '🌊', prompt: '수영할 줄 아는 친구', difficulty: 'medium' },
  { emoji: '🎵', prompt: '요즘 빠져있는 노래가 있는 친구', difficulty: 'easy' },
  { emoji: '🎂', prompt: '내 생일이랑 같은 달인 친구', difficulty: 'medium' },
  { emoji: '✋', prompt: '나랑 손 크기가 비슷한 친구', difficulty: 'easy' },
]
