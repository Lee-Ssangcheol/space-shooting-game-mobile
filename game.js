// game.js 파일 맨 위에 추가
console.log('게임 파일 수정됨:', new Date().toLocaleString());

// 게임 상수 정의
const SPECIAL_WEAPON_MAX_CHARGE = 1000;  // 특수무기 최대 충전량
const SPECIAL_WEAPON_CHARGE_RATE = 10;   // 특수무기 충전 속도
const TOP_EFFECT_ZONE = 20;  // 상단 효과 무시 영역 (픽셀)

// 모바일 디바이스 감지 (종이비행기용과 동일하게)
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// 모바일 속도 조절 (80% 속도)
const mobileSpeedMultiplier = isMobile ? 0.8 : 1.0;

// 모바일 전체화면 모드 활성화
function enableFullscreen() {
    if (isMobile) {
        // iOS Safari 전체화면 모드
        if (document.documentElement.requestFullscreen) {
            const fullscreenPromise = document.documentElement.requestFullscreen();
            if (fullscreenPromise && typeof fullscreenPromise.catch === 'function') {
                fullscreenPromise.catch(err => {
                    console.log('전체화면 모드 실패:', err);
                });
            }
        }
        
        // iOS Safari에서 주소창 숨김
        if (window.navigator.standalone) {
            document.body.style.position = 'fixed';
            document.body.style.top = '0';
            document.body.style.left = '0';
            document.body.style.width = '100vw';
            document.body.style.height = '100vh';
        }
        
        // Android Chrome 전체화면 모드
        if (document.documentElement.webkitRequestFullscreen) {
            const webkitPromise = document.documentElement.webkitRequestFullscreen();
            if (webkitPromise && typeof webkitPromise.catch === 'function') {
                webkitPromise.catch(err => {
                    console.log('webkit 전체화면 모드 실패:', err);
                });
            }
        }
        
        // 화면 방향 고정 (세로 모드)
        if (screen.orientation && screen.orientation.lock) {
            const orientationPromise = screen.orientation.lock('portrait');
            if (orientationPromise && typeof orientationPromise.catch === 'function') {
                orientationPromise.catch(err => {
                    console.log('화면 방향 고정 실패:', err);
                });
            }
        }
        
        console.log('모바일 전체화면 모드 활성화 시도');
    }
}

// 터치 드래그 관련 변수
let isDragging = false;
let touchStartX = 0;
let touchStartY = 0;
let playerStartX = 0;
let playerStartY = 0;

// 모바일 연속 발사 관련 변수
let mobileFireStartTime = 0;
let isMobileFirePressed = false;
let mobileContinuousFireInterval = null;
// 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 캔버스 크기 설정
function resizeCanvas() {
    const container = document.getElementById('canvas-container');
    if (container) {
        // 컨테이너 스타일 조정
        container.style.height = 'calc(100vh - 70px)';  // 모바일 컨트롤 높이만큼 제외
        container.style.position = 'relative';
        container.style.overflow = 'hidden';
        
        // 캔버스 스타일 조정
        canvas.style.borderRadius = '0';  // 모서리를 각지게
        
        // 캔버스 크기를 모바일 비율에 맞게 설정 (일관성 유지)
        canvas.width = 392;  // 모바일 비율에 맞춘 가로 크기
        canvas.height = 700;  // 모바일 비율에 맞춘 세로 크기
        
        // CSS에서 설정한 크기와 일치하도록 스타일 설정
        canvas.style.width = '392px';
        canvas.style.height = '700px';
    }
}

// 창 크기 변경 시 캔버스 크기 조정
window.addEventListener('resize', resizeCanvas);

// 초기 캔버스 크기 설정
resizeCanvas();

// 모바일 터치 컨트롤 요소들
const mobileControls = {
    btnUp: document.getElementById('btn-up'),
    btnDown: document.getElementById('btn-down'),
    btnLeft: document.getElementById('btn-left'),
    btnRight: document.getElementById('btn-right'),
    btnFire: document.getElementById('btn-fire'),
    btnSpecial: document.getElementById('btn-special'),
    btnPause: document.getElementById('btn-pause'),
    btnReset: document.getElementById('btn-reset')
};

// 모바일 컨트롤 요소 확인
console.log('모바일 컨트롤 요소들:', mobileControls);

// 화면에 모바일 컨트롤 상태 표시
function showMobileControlStatus() {
    // 모바일 컨트롤 상태 표시 제거 (게임 상황 안내와 겹침 방지)
    // if (isMobile) {
    //     ctx.fillStyle = 'white';
    //     ctx.font = '14px Arial';
    //     ctx.fillText('모바일 모드', 10, 70);
    //     
    //     // 각 버튼의 존재 여부 표시
    //     const buttons = ['btnFire', 'btnSpecial', 'btnPause', 'btnReset', 'btnUp', 'btnDown', 'btnLeft', 'btnRight'];
    //     buttons.forEach((btn, index) => {
    //         const element = mobileControls[btn];
    //         const status = element ? '✓' : '✗';
    //         ctx.fillText(`${btn}: ${status}`, 10, 90 + index * 15);
    //     });
    // }
}

// 모바일 터치 컨트롤 이벤트 설정
function setupMobileControls() {
    console.log('모바일 컨트롤 설정 시작');
    console.log('isMobile:', isMobile);
    console.log('모바일 감지 상세:', {
        userAgent: navigator.userAgent,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        ontouchstart: 'ontouchstart' in window,
        maxTouchPoints: navigator.maxTouchPoints
    });
    
    if (!isMobile) {
        console.log('데스크탑 환경이므로 모바일 컨트롤 설정 건너뜀');
        return;
    }
    
    // 방향키 터치 이벤트
    mobileControls.btnUp.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys.ArrowUp = true;
    }, { passive: false });
    mobileControls.btnUp.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys.ArrowUp = false;
    }, { passive: false });
    
    mobileControls.btnDown.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys.ArrowDown = true;
    }, { passive: false });
    mobileControls.btnDown.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys.ArrowDown = false;
    }, { passive: false });
    
    mobileControls.btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys.ArrowLeft = true;
    }, { passive: false });
    mobileControls.btnLeft.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys.ArrowLeft = false;
    }, { passive: false });
    
    mobileControls.btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys.ArrowRight = true;
    }, { passive: false });
    mobileControls.btnRight.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys.ArrowRight = false;
    }, { passive: false });
    
    // 캔버스 터치 이벤트 (플레이어 이동용만 - 시작/재시작은 버튼으로만)
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('모바일 터치 시작');
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        
        // 캔버스 좌표계로 변환 (CSS 크기와 실제 캔버스 크기의 비율 고려)
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
        console.log('터치 위치 계산:', {
            touchX: touch.clientX,
            touchY: touch.clientY,
            rectLeft: rect.left,
            rectTop: rect.top,
            scaleX: scaleX,
            scaleY: scaleY,
            canvasX: x,
            canvasY: y,
            playerWidth: player.width,
            playerHeight: player.height,
            calculatedX: x - player.width * 2,
            calculatedY: y - player.height * 2
        });
        

        
        // 플레이어 위치 업데이트 - 터치점이 플레이어 꼬리 끝에 정확히 오도록 조정
        const tailLength = player.height;
        player.x = Math.max(0, Math.min(canvas.width - player.width, x - player.width / 2));
        player.y = Math.max(0, Math.min(canvas.height - player.height, y - player.height - tailLength));
        
        // 디버깅 정보를 화면에 표시하기 위한 전역 변수
        window.debugInfo = {
            touchX: x,
            touchY: y,
            calculatedY: y - 50,
            finalY: player.y,
            playerHeight: player.height,
            canvasHeight: canvas.height,
            timestamp: Date.now()
        };
        
        // 두 번째 비행기가 있으면 함께 이동
        if (hasSecondPlane) {
            secondPlane.x = player.x - 60;
            secondPlane.y = player.y;
        }
        
        // 게임이 시작되지 않았다면 시작 (버튼으로만 시작하도록 제거)
        // if (isStartScreen) {
        //     // 오디오 초기화
        //     initAudio();
        //     isStartScreen = false;
        //     gameStarted = true;
        //     console.log('모바일 터치로 게임 시작:', { isStartScreen, gameStarted });
        // }
        
        // 게임 오버 상태에서 재시작 (버튼으로만 재시작하도록 제거)
        // if (isGameOver) {
        //     restartGame();
        //     return;
        // }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        
        // 캔버스 좌표계로 변환 (CSS 크기와 실제 캔버스 크기의 비율 고려)
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
        // 플레이어 위치 업데이트 - 터치점이 플레이어 꼬리 끝에 정확히 오도록 조정
        const tailLength = player.height;
        player.x = Math.max(0, Math.min(canvas.width - player.width, x - player.width / 2));
        player.y = Math.max(0, Math.min(canvas.height - player.height, y - player.height - tailLength));
        
        // 두 번째 비행기가 있으면 함께 이동
        if (hasSecondPlane) {
            secondPlane.x = player.x - 60;
            secondPlane.y = player.y;
        }
    }, { passive: false });
    
    // 시작/재시작 버튼 터치 이벤트
    mobileControls.btnFire.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('시작/재시작 버튼 터치');
        
        // 시작 화면에서 버튼을 누르면 게임 시작
        if (isStartScreen) {
            // 오디오 초기화
            initAudio();
            isStartScreen = false;
            gameStarted = true;
            console.log('모바일 버튼으로 게임 시작:', { isStartScreen, gameStarted });
        }
        
        // 게임 오버 상태에서 재시작
        if (isGameOver) {
            restartGame();
            return;
        }
    }, { passive: false });
    
    mobileControls.btnFire.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('시작/재시작 버튼 터치 종료');
    }, { passive: false });
    
    // 클릭 이벤트도 추가 (데스크탑용)
    mobileControls.btnFire.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('시작/재시작 버튼 클릭');
        
        if (isStartScreen) {
            // 오디오 초기화
            initAudio();
            isStartScreen = false;
            gameStarted = true;
            console.log('모바일 클릭으로 게임 시작:', { isStartScreen, gameStarted });
        }
        
        // 게임 오버 상태에서 재시작
        if (isGameOver) {
            restartGame();
            return;
        }
    });
    
    mobileControls.btnSpecial.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys.KeyB = true;
    }, { passive: false });
    mobileControls.btnSpecial.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys.KeyB = false;
    }, { passive: false });
    
    mobileControls.btnPause.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('일시정지 버튼 터치');
        
        if (!isGameOver) {
            isPaused = !isPaused;
            console.log('일시정지 상태:', isPaused);
        }
    }, { passive: false });
    
    mobileControls.btnReset.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('최고점수 리셋 버튼 터치');
        
        // 최고 점수 리셋 확인
        if (confirm('최고 점수를 리셋하시겠습니까?')) {
            ScoreManager.reset().then(() => {
                console.log('ScoreManager를 통한 최고 점수 리셋 완료');
            }).catch(error => {
                console.error('ScoreManager 리셋 실패:', error);
                // 백업 리셋 방법 - 모든 저장소 완전 클리어
                try {
                    highScore = 0;
                    score = 0;
                    levelScore = 0;
                    scoreForSpread = 0;
                    gameLevel = 1;
                    
                    // localStorage 완전 클리어
                    localStorage.removeItem('highScore');
                    localStorage.removeItem('highScore_backup');
                    localStorage.removeItem('highScore_timestamp');
                    localStorage.removeItem('gameScore');
                    localStorage.removeItem('gameScore_backup');
                    // 리셋 완료 표시
                    localStorage.setItem('scoreResetComplete', 'true');
                    localStorage.setItem('resetTimestamp', Date.now().toString());
                    
                    // sessionStorage 완전 클리어
                    sessionStorage.removeItem('highScore');
                    sessionStorage.removeItem('gameScore');
                    sessionStorage.clear();
                    // 리셋 완료 표시
                    sessionStorage.setItem('scoreResetComplete', 'true');
                    sessionStorage.setItem('resetTimestamp', Date.now().toString());
                    
                    console.log('백업 방법으로 모든 저장소 완전 리셋 완료');
                } catch (e) {
                    console.error('백업 리셋도 실패:', e);
                }
            });
        }
    }, { passive: false });
    
    // 클릭 이벤트도 추가 (데스크탑용)
    mobileControls.btnReset.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('최고점수 리셋 버튼 클릭');
        
        // 최고 점수 리셋 확인
        if (confirm('최고 점수를 리셋하시겠습니까?')) {
            ScoreManager.reset().then(() => {
                console.log('ScoreManager를 통한 최고 점수 리셋 완료');
            }).catch(error => {
                console.error('ScoreManager 리셋 실패:', error);
                // 백업 리셋 방법 - 모든 저장소 완전 클리어
                try {
                    highScore = 0;
                    score = 0;
                    levelScore = 0;
                    scoreForSpread = 0;
                    gameLevel = 1;
                    
                    // localStorage 완전 클리어
                    localStorage.removeItem('highScore');
                    localStorage.removeItem('highScore_backup');
                    localStorage.removeItem('highScore_timestamp');
                    localStorage.removeItem('gameScore');
                    localStorage.removeItem('gameScore_backup');
                    // 리셋 완료 표시
                    localStorage.setItem('scoreResetComplete', 'true');
                    localStorage.setItem('resetTimestamp', Date.now().toString());
                    
                    // sessionStorage 완전 클리어
                    sessionStorage.removeItem('highScore');
                    sessionStorage.removeItem('gameScore');
                    sessionStorage.clear();
                    // 리셋 완료 표시
                    sessionStorage.setItem('scoreResetComplete', 'true');
                    sessionStorage.setItem('resetTimestamp', Date.now().toString());
                    
                    console.log('백업 방법으로 모든 저장소 완전 리셋 완료');
                } catch (e) {
                    console.error('백업 리셋도 실패:', e);
                }
            });
        }
    });
    
    console.log('모바일 컨트롤 설정 완료');
}

// 오디오 요소 생성 (안전하게)
let shootSound, explosionSound, collisionSound;
let audioInitialized = false;

// 사운드 초기화 함수
function initAudio() {
    try {
        if (!audioInitialized) {
            shootSound = new Audio('sounds/shoot.mp3');
            explosionSound = new Audio('sounds/explosion.mp3');
            collisionSound = new Audio('sounds/collision.mp3');

            // 사운드 설정
            shootSound.volume = 0.4;
            explosionSound.volume = 0.6;
            collisionSound.volume = 0.5;

            // 충돌 사운드 길이 제어
            collisionSound.addEventListener('loadedmetadata', () => {
                collisionSound.duration = Math.min(collisionSound.duration, 0.8);
            });

            audioInitialized = true;
            console.log('오디오 초기화 완료');
        }
    } catch (error) {
        console.warn('오디오 초기화 실패:', error);
        // 오디오 실패 시 더미 객체 생성
        shootSound = { play: () => Promise.resolve(), currentTime: 0 };
        explosionSound = { play: () => Promise.resolve(), currentTime: 0 };
        collisionSound = { play: () => Promise.resolve(), currentTime: 0 };
    }
}

// 충돌 사운드 재생 시간 제어를 위한 변수 추가
let lastCollisionTime = 0;
const collisionSoundCooldown = 300;  // 충돌음 쿨다운 시간 증가

// 플레이어 우주선
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 40,
    height: 40,
    speed: 8 * mobileSpeedMultiplier
};

// 두 번째 비행기
const secondPlane = {
    x: canvas.width / 2 - 60,
    y: canvas.height - 50,
    width: 40,
    height: 40,
    speed: 8 * mobileSpeedMultiplier
};

// 게임 상태 변수 설정
let bullets = [];          // 총알 배열
let enemies = [];         // 적 배열
let explosions = [];      // 폭발 효과 배열
let gameLevel = 1;        // 게임 레벨
let levelScore = 0;       // 레벨 점수
let levelUpScore = 1000;  // 레벨업에 필요한 점수
let score = 0;           // 현재 점수
let highScore = 0;       // 최고 점수 (초기값 0으로 설정)
let scoreForSpread = 0;   // 확산탄을 위한 점수
let hasSecondPlane = false;  // 두 번째 비행기 보유 여부
let secondPlaneTimer = 0;    // 두 번째 비행기 타이머
let isPaused = false;     // 일시정지 상태
let collisionCount = 0;   // 충돌 횟수
let isGameOver = false;   // 게임 오버 상태
let flashTimer = 0;       // 깜박임 효과 타이머
let flashDuration = 500;  // 깜박임 지속 시간
let gameOverStartTime = null;  // 게임 오버 시작 시간
let isSnakePatternActive = false;  // 뱀 패턴 활성화 상태
let snakePatternTimer = 0;  // 뱀 패턴 타이머
let snakePatternDuration = 10000;  // 뱀 패턴 지속 시간 (10초)
let snakeEnemies = [];  // 뱀 패턴의 적군 배열
let snakePatternInterval = 0;  // 뱀 패턴 생성 간격
let snakeGroups = [];  // 뱀 패턴 그룹 배열
let lastSnakeGroupTime = 0;  // 마지막 뱀 그룹 생성 시간
const snakeGroupInterval = 5000;  // 그룹 생성 간격 (5초)
const maxSnakeGroups = 3;  // 최대 동시 그룹 수
let gameVersion = '1.0.0-202506161826';  // 게임 버전

// 게임 루프 실행 상태 변수 추가
let gameLoopRunning = false;

// 게임 상태 변수에 추가
let bossActive = false;
let bossHealth = 0;
let bossDestroyed = false;  // 보스 파괴 상태
let bossPattern = 0;
let specialWeaponCharged = false;
let specialWeaponCharge = 0;



// 보스 패턴 상수 추가
const BOSS_PATTERNS = {
    BASIC: 'basic',           // 기본 패턴 추가
    CIRCLE_SHOT: 'circle_shot',
    CROSS_SHOT: 'cross_shot',
    SPIRAL_SHOT: 'spiral_shot',
    WAVE_SHOT: 'wave_shot',
    DIAMOND_SHOT: 'diamond_shot',
    RANDOM_SPREAD: 'random_spread',
    DOUBLE_SPIRAL: 'double_spiral',
    TRIPLE_WAVE: 'triple_wave',
    TARGETED_SHOT: 'targeted_shot',
    BURST_SHOT: 'burst_shot'
};

// 키보드 입력 상태
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    Space: false,
    KeyB: false,  // 특수 무기 발사 키를 V에서 B로 변경
    F5: false,
    KeyP: false
};

// 난이도 설정
const difficultySettings = {
    1: { // 초급
        enemySpeed: 2 * mobileSpeedMultiplier,
        enemySpawnRate: 0.02,
        horizontalSpeedRange: 2 * mobileSpeedMultiplier,
        patternChance: 0.2,
        maxEnemies: 5,
        bossHealth: 800,
        bossSpawnInterval: 10000, // 10초
        powerUpChance: 0.1,
        bombDropChance: 0.1,
        dynamiteDropChance: 0.05
    },
    2: { // 중급
        enemySpeed: 3 * mobileSpeedMultiplier,
        enemySpawnRate: 0.03,
        horizontalSpeedRange: 3 * mobileSpeedMultiplier,
        patternChance: 0.4,
        maxEnemies: 8,
        bossHealth: 1000,
        bossSpawnInterval: 10000, // 10초
        powerUpChance: 0.15,
        bombDropChance: 0.15,
        dynamiteDropChance: 0.1
    },
    3: { // 고급
        enemySpeed: 4 * mobileSpeedMultiplier,
        enemySpawnRate: 0.04,
        horizontalSpeedRange: 4 * mobileSpeedMultiplier,
        patternChance: 0.6,
        maxEnemies: 12,
        bossHealth: 1200,
        bossSpawnInterval: 10000, // 10초
        powerUpChance: 0.2,
        bombDropChance: 0.2,
        dynamiteDropChance: 0.15
    },
    4: { // 전문가
        enemySpeed: 5 * mobileSpeedMultiplier,
        enemySpawnRate: 0.05,
        horizontalSpeedRange: 5 * mobileSpeedMultiplier,
        patternChance: 0.8,
        maxEnemies: 15,
        bossHealth: 1500,
        bossSpawnInterval: 10000, // 10초
        powerUpChance: 0.25,
        bombDropChance: 0.25,
        dynamiteDropChance: 0.2
    },
    5: { // 마스터
        enemySpeed: 6 * mobileSpeedMultiplier,
        enemySpawnRate: 0.06,
        horizontalSpeedRange: 6 * mobileSpeedMultiplier,
        patternChance: 1.0,
        maxEnemies: 20,
        bossHealth: 2000,
        bossSpawnInterval: 10000, // 10초
        powerUpChance: 0.3,
        bombDropChance: 0.3,
        dynamiteDropChance: 0.25
    }
};

// IndexedDB 설정
const dbName = 'ShootingGameDB';
const dbVersion = 1;
const storeName = 'highScores';

// 최고 점수 로드 함수
async function loadHighScore() {
    try {
        console.log('점수 로드 시작...');
        let maxScore = 0;
        
        // localStorage에서 점수 로드 (가장 먼저)
        try {
            const localStorageScore = parseInt(localStorage.getItem('highScore')) || 0;
            const backupScore = parseInt(localStorage.getItem('highScore_backup')) || 0;
            maxScore = Math.max(maxScore, localStorageScore, backupScore);
            console.log('localStorage 점수:', { localStorageScore, backupScore });
        } catch (e) {
            console.warn('localStorage 로드 실패:', e);
        }
        
        // IndexedDB에서 점수 로드
        try {
            const indexedDBScore = await loadScoreFromIndexedDB();
            console.log('IndexedDB 점수:', indexedDBScore);
            maxScore = Math.max(maxScore, indexedDBScore);
        } catch (e) {
            console.warn('IndexedDB 로드 실패:', e);
        }
        
        // sessionStorage에서 점수 로드
        try {
            const sessionScore = parseInt(sessionStorage.getItem('currentHighScore')) || 0;
            maxScore = Math.max(maxScore, sessionScore);
            console.log('sessionStorage 점수:', sessionScore);
        } catch (e) {
            console.warn('sessionStorage 로드 실패:', e);
        }
        
        console.log('최종 선택된 점수:', maxScore);
        
        // 최고 점수가 있으면 모든 저장소에 동기화
        if (maxScore > 0) {
            try {
                // localStorage에 저장
                localStorage.setItem('highScore', maxScore.toString());
                localStorage.setItem('highScore_backup', maxScore.toString());
                localStorage.setItem('highScore_timestamp', Date.now().toString());
                
                // sessionStorage에 저장
                sessionStorage.setItem('currentHighScore', maxScore.toString());
                
                // IndexedDB에 저장
                await saveScoreToIndexedDB(maxScore);
                
                console.log('모든 저장소 동기화 완료');
            } catch (e) {
                console.warn('저장소 동기화 실패:', e);
            }
        }
        
        return maxScore;
    } catch (error) {
        console.error('점수 로드 실패:', error);
        return 0;
    }
}

// IndexedDB 초기화 함수
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onerror = (event) => {
            console.error('IndexedDB 초기화 실패:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            console.log('IndexedDB 초기화 성공');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                const store = db.createObjectStore(storeName, { keyPath: 'id' });
                store.createIndex('score', 'score', { unique: false });
                console.log('점수 저장소 생성 완료');
            }
        };
    });
}

// IndexedDB에 점수 저장
async function saveScoreToIndexedDB(score) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const scoreData = {
                id: 'currentHighScore',
                score: score,
                timestamp: Date.now()
            };

            const request = store.put(scoreData);

            request.onsuccess = () => {
                console.log('IndexedDB 점수 저장 성공:', score);
                // localStorage에도 동시에 저장
                try {
                    localStorage.setItem('highScore', score.toString());
                    localStorage.setItem('highScore_backup', score.toString());
                    localStorage.setItem('highScore_timestamp', Date.now().toString());
                    console.log('localStorage 동시 저장 성공');
                } catch (e) {
                    console.warn('localStorage 동시 저장 실패:', e);
                }
                resolve(true);
            };

            request.onerror = (event) => {
                console.error('IndexedDB 점수 저장 실패:', event.target.error);
                // IndexedDB 실패 시 localStorage에만 저장
                try {
                    localStorage.setItem('highScore', score.toString());
                    localStorage.setItem('highScore_backup', score.toString());
                    localStorage.setItem('highScore_timestamp', Date.now().toString());
                    console.log('localStorage 대체 저장 성공');
                    resolve(true);
                } catch (e) {
                    console.error('localStorage 대체 저장도 실패:', e);
                    reject(e);
                }
            };

            // 트랜잭션 완료 대기
            transaction.oncomplete = () => {
                console.log('IndexedDB 트랜잭션 완료');
            };

            transaction.onerror = (event) => {
                console.error('IndexedDB 트랜잭션 실패:', event.target.error);
            };
        });
    } catch (error) {
        console.error('IndexedDB 저장 중 오류:', error);
        // IndexedDB 실패 시 localStorage에만 저장
        try {
            localStorage.setItem('highScore', score.toString());
            localStorage.setItem('highScore_backup', score.toString());
            localStorage.setItem('highScore_timestamp', Date.now().toString());
            console.log('localStorage 대체 저장 성공');
            return true;
        } catch (e) {
            console.error('localStorage 대체 저장도 실패:', e);
            return false;
        }
    }
}

// IndexedDB에서 점수 로드
async function loadScoreFromIndexedDB() {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get('currentHighScore');

            request.onsuccess = () => {
                const result = request.result;
                const score = result ? result.score : 0;
                console.log('IndexedDB에서 로드된 점수:', score);
                
                // localStorage와 비교하여 더 높은 점수 사용
                try {
                    const localScore = parseInt(localStorage.getItem('highScore')) || 0;
                    const backupScore = parseInt(localStorage.getItem('highScore_backup')) || 0;
                    const maxScore = Math.max(score, localScore, backupScore);
                    
                    if (maxScore > score) {
                        console.log('localStorage에서 더 높은 점수 발견:', maxScore);
                        // 더 높은 점수를 IndexedDB에 저장
                        saveScoreToIndexedDB(maxScore).catch(console.error);
                    }
                    
                    resolve(maxScore);
                } catch (e) {
                    console.warn('localStorage 비교 중 오류:', e);
                    resolve(score);
                }
            };

            request.onerror = (event) => {
                console.error('IndexedDB 점수 로드 실패:', event.target.error);
                // IndexedDB 실패 시 localStorage에서 로드
                try {
                    const localScore = parseInt(localStorage.getItem('highScore')) || 0;
                    const backupScore = parseInt(localStorage.getItem('highScore_backup')) || 0;
                    const maxScore = Math.max(localScore, backupScore);
                    console.log('localStorage에서 로드된 점수:', maxScore);
                    resolve(maxScore);
                } catch (e) {
                    console.error('localStorage 로드도 실패:', e);
                    reject(e);
                }
            };
        });
    } catch (error) {
        console.error('IndexedDB 로드 중 오류:', error);
        // localStorage에서 로드 시도
        try {
            const localScore = parseInt(localStorage.getItem('highScore')) || 0;
            const backupScore = parseInt(localStorage.getItem('highScore_backup')) || 0;
            const maxScore = Math.max(localScore, backupScore);
            console.log('localStorage에서 로드된 점수:', maxScore);
            return maxScore;
        } catch (e) {
            console.error('localStorage 로드도 실패:', e);
            return 0;
        }
    }
}

// 점수 저장 함수
async function saveHighScoreDirectly(newScore, reason = '') {
    try {
        // 현재 저장된 점수 확인
        const currentStored = parseInt(localStorage.getItem('highScore')) || 0;
        console.log('현재 저장된 점수:', currentStored, '새 점수:', newScore);
        
        // 새 점수가 더 높은 경우에만 저장
        if (newScore > currentStored) {
            // localStorage에 저장 (가장 먼저)
            try {
                localStorage.setItem('highScore', newScore.toString());
                localStorage.setItem('highScore_backup', newScore.toString());
                localStorage.setItem('highScore_timestamp', Date.now().toString());
                console.log('localStorage 저장 성공');
            } catch (e) {
                console.warn('localStorage 저장 실패:', e);
            }
            
            // sessionStorage에 저장
            try {
                sessionStorage.setItem('currentHighScore', newScore.toString());
                console.log('sessionStorage 저장 성공');
            } catch (e) {
                console.warn('sessionStorage 저장 실패:', e);
            }
            
            // IndexedDB에 저장
            try {
                const saved = await saveScoreToIndexedDB(newScore);
                if (!saved) {
                    throw new Error('IndexedDB 저장 실패');
                }
                console.log('IndexedDB 저장 성공');
            } catch (e) {
                console.error('IndexedDB 저장 실패:', e);
            }
            
            console.log(`최고 점수 저장 성공 (${reason}):`, {
                previous: currentStored,
                new: newScore
            });
        }
        return true;
    } catch (error) {
        console.error('점수 저장 실패:', error);
        return false;
    }
}

// 점수 관리 객체 수정
const ScoreManager = {
    async init() {
        try {
            console.log('ScoreManager 초기화 시작');
            // Electron IPC를 통해 점수 로드
            highScore = await window.electron.ipcRenderer.invoke('load-score');
            
            // 현재 점수 초기화
            score = 0;
            levelScore = 0;
            scoreForSpread = 0;
            
            console.log('초기화 완료 - 현재 최고 점수:', highScore);
        } catch (error) {
            console.error('초기화 실패:', error);
            highScore = 0;
        }
    },

    async save() {
        try {
            if (score > highScore) {
                highScore = score;
                // Electron IPC를 통해 점수 저장
                const saved = await window.electron.ipcRenderer.invoke('save-score', highScore);
                if (saved) {
                    console.log('점수 저장 성공:', highScore);
                }
            }
        } catch (error) {
            console.error('점수 저장 실패:', error);
        }
    },

    async getHighScore() {
        try {
            // Electron IPC를 통해 점수 로드
            return await window.electron.ipcRenderer.invoke('load-score');
        } catch (error) {
            console.error('최고 점수 로드 실패:', error);
            return 0;
        }
    },

    async reset() {
        try {
            console.log('ScoreManager 리셋 시작');
            
            // 1. Electron IPC를 통해 점수 초기화
            try {
                await window.electron.ipcRenderer.invoke('reset-score');
                console.log('ScoreManager Electron IPC 리셋 완료');
            } catch (e) {
                console.warn('ScoreManager Electron IPC 리셋 실패:', e);
            }
            
            // 2. localStorage 완전 리셋
            try {
                localStorage.removeItem('highScore');
                localStorage.removeItem('highScore_backup');
                localStorage.removeItem('highScore_timestamp');
                localStorage.removeItem('gameScore');
                localStorage.removeItem('gameScore_backup');
                // 리셋 완료 표시
                localStorage.setItem('scoreResetComplete', 'true');
                localStorage.setItem('resetTimestamp', Date.now().toString());
                console.log('ScoreManager localStorage 완전 리셋 완료');
            } catch (e) {
                console.warn('ScoreManager localStorage 리셋 실패:', e);
            }
            
            // 3. sessionStorage 완전 리셋
            try {
                sessionStorage.removeItem('highScore');
                sessionStorage.removeItem('gameScore');
                sessionStorage.clear();
                // 리셋 완료 표시
                sessionStorage.setItem('scoreResetComplete', 'true');
                sessionStorage.setItem('resetTimestamp', Date.now().toString());
                console.log('ScoreManager sessionStorage 완전 리셋 완료');
            } catch (e) {
                console.warn('ScoreManager sessionStorage 리셋 실패:', e);
            }
            
            // 4. IndexedDB 리셋
            try {
                const db = await initDB();
                const transaction = db.transaction(['scores'], 'readwrite');
                const objectStore = transaction.objectStore('scores');
                await objectStore.clear();
                console.log('ScoreManager IndexedDB 리셋 완료');
            } catch (e) {
                console.warn('ScoreManager IndexedDB 리셋 실패:', e);
            }
            
            // 5. 메모리 변수 리셋
            score = 0;
            levelScore = 0;
            scoreForSpread = 0;
            gameLevel = 1;
            highScore = 0;
            
            console.log('ScoreManager 모든 저장소 리셋 완료 - 현재 최고 점수:', highScore);
        } catch (error) {
            console.error('ScoreManager 리셋 중 오류:', error);
            // 최종 백업 리셋
            highScore = 0;
            score = 0;
            levelScore = 0;
            scoreForSpread = 0;
            gameLevel = 1;
        }
    }
};

// 자동 저장 기능 수정
setInterval(async () => {
    // 리셋 후에는 자동 저장하지 않음
    const resetComplete = localStorage.getItem('scoreResetComplete') === 'true';
    const resetTimestamp = parseInt(localStorage.getItem('resetTimestamp') || '0');
    const timeSinceReset = Date.now() - resetTimestamp;
    
    // 리셋 후 10초 이내에는 자동 저장하지 않음
    if (resetComplete && timeSinceReset < 10000) {
        return;
    }
    
    if (score > 0 || highScore > 0) {
        const currentMax = Math.max(score, highScore);
        await saveHighScoreDirectly(currentMax, 'AutoSave');
    }
}, 5000);

// 브라우저 종료 시 점수 저장을 위한 이벤트 핸들러들
function setupExitHandlers() {
    // 페이지 가시성 변경 시
    document.addEventListener('visibilitychange', async () => {
        if (document.hidden) {
            const currentMax = Math.max(score, highScore);
            if (currentMax > 0) {
                await saveHighScoreDirectly(currentMax, 'visibilitychange');
            }
        }
    });

    // 페이지 언로드 시
    window.addEventListener('unload', async (event) => {
        const finalScore = Math.max(score, highScore);
        if (finalScore > 0) {
            // 동기적으로 localStorage에 저장
            try {
                localStorage.setItem('highScore', finalScore.toString());
                localStorage.setItem('highScore_backup', finalScore.toString());
                localStorage.setItem('highScore_timestamp', Date.now().toString());
                console.log('unload 이벤트에서 localStorage 저장 성공');
            } catch (e) {
                console.error('unload 이벤트에서 localStorage 저장 실패:', e);
            }
            
            // IndexedDB 저장 시도
            try {
                await saveScoreToIndexedDB(finalScore);
                console.log('unload 이벤트에서 IndexedDB 저장 성공');
            } catch (e) {
                console.error('unload 이벤트에서 IndexedDB 저장 실패:', e);
            }
        }
    });

    // 페이지 숨김 시
    window.addEventListener('pagehide', async (event) => {
        const finalScore = Math.max(score, highScore);
        if (finalScore > 0) {
            await saveHighScoreDirectly(finalScore, 'pagehide');
        }
    });

    // 페이지 언로드 전
    window.addEventListener('beforeunload', async (event) => {
        const finalScore = Math.max(score, highScore);
        if (finalScore > 0) {
            // 동기적으로 localStorage에 먼저 저장
            try {
                localStorage.setItem('highScore', finalScore.toString());
                localStorage.setItem('highScore_backup', finalScore.toString());
                localStorage.setItem('highScore_timestamp', Date.now().toString());
                console.log('beforeunload 이벤트에서 localStorage 저장 성공');
            } catch (e) {
                console.error('beforeunload 이벤트에서 localStorage 저장 실패:', e);
            }
            
            // IndexedDB 저장 시도
            try {
                await saveScoreToIndexedDB(finalScore);
                console.log('beforeunload 이벤트에서 IndexedDB 저장 성공');
            } catch (e) {
                console.error('beforeunload 이벤트에서 IndexedDB 저장 실패:', e);
            }
            
            // 저장이 완료될 때까지 잠시 대기
            const start = Date.now();
            while (Date.now() - start < 200) {
                // 200ms 동안 대기
            }
        }
    });
}

// 게임 초기화 함수 수정
async function initializeGame() {
    console.log('게임 초기화 시작');
    isGameActive = true;
    isSoundControlActive = false;
    
    try {
        // 종료 이벤트 핸들러 설정
        setupExitHandlers();
        
        // 최고 점수 로드
        highScore = await loadHighScore();
        console.log('초기화된 최고 점수:', highScore);
        
        // === 모든 게임 요소 완전 초기화 ===
        
        // 1. 충돌 및 게임 상태 초기화
        collisionCount = 0;
        maxLives = 5;  // 최대 목숨 초기화
        hasSecondPlane = false;
        secondPlaneTimer = 0;
        
        // 2. 모든 배열 완전 초기화
        score = 0;
        levelScore = 0;
        scoreForSpread = 0;
        bullets = [];           // 총알 배열 초기화
        enemies = [];           // 적 비행기 배열 초기화
        explosions = [];        // 폭발 효과 배열 초기화
        bombs = [];             // 폭탄 배열 초기화
        dynamites = [];         // 다이나마이트 배열 초기화
        powerUps = [];          // 파워업 배열 초기화
        snakeEnemies = [];      // 뱀 패턴 적 배열 초기화
        snakeGroups = [];       // 뱀 패턴 그룹 배열 초기화
        
        // 3. 게임 상태 초기화
        isGameOver = false;
        isPaused = false;
        flashTimer = 0;
        gameOverStartTime = null;
        
        // 4. 뱀 패턴 상태 초기화
        isSnakePatternActive = false;
        snakePatternTimer = 0;
        snakePatternInterval = 0;
        lastSnakeGroupTime = 0;
        
        // 5. 보스 관련 상태 완전 초기화
        bossActive = false;
        bossHealth = 0;
        bossDestroyed = false;
        bossPattern = 0;
        lastBossSpawnTime = Date.now();
        

        
        // 6. 플레이어 초기 위치 설정
        player.x = canvas.width / 2;
        player.y = canvas.height - 50;
        secondPlane.x = canvas.width / 2 - 60;
        secondPlane.y = canvas.height - 50;
        
        // 7. 게임 타이머 초기화
        lastEnemySpawnTime = 0;
        
        // 8. 파워업 상태 초기화
        hasSpreadShot = false;
        hasShield = false;
        damageMultiplier = 1;
        fireRateMultiplier = 1;
        
        // 9. 발사 관련 상태 초기화
        lastFireTime = 0;
        isSpacePressed = false;
        spacePressTime = 0;
        fireDelay = 600;
        continuousFireDelay = 50;
        bulletSpeed = 12 * mobileSpeedMultiplier;
        baseBulletSize = 4.5;
        isContinuousFire = false;
        canFire = true;
        lastReleaseTime = 0;
        singleShotCooldown = 500;
        minPressDuration = 200;
        minReleaseDuration = 100;
        
        // 10. 특수무기 관련 상태 초기화
        specialWeaponCharged = false;
        specialWeaponCharge = 0;
        
        // 11. 키보드 입력 상태 초기화
        Object.keys(keys).forEach(key => {
            keys[key] = false;
        });
        
        // 12. 사운드 관련 상태 초기화
        lastCollisionTime = 0;
        lastExplosionTime = 0;
        
        // 13. 패턴 추적 시스템 초기화
        levelBossPatterns.usedPatterns = [];
        levelBossPatterns.currentLevelPattern = null;
        
        console.log('게임 상태 초기화 완료');
        console.log('초기화된 상태:', {
            enemies: enemies.length,
            bullets: bullets.length,
            explosions: explosions.length,
            bombs: bombs.length,
            dynamites: dynamites.length,
            powerUps: powerUps.length,
            snakeGroups: snakeGroups.length,
            bossActive: bossActive,
            isSnakePatternActive: isSnakePatternActive
        });
        
        // 게임 루프 시작
        startGameLoop();
        console.log('게임 루프 시작됨');
        
        // 자동 시작 제거 - 사용자가 직접 시작하도록 함

    } catch (error) {
        console.error('게임 초기화 중 오류:', error);
    }
}

// 게임 재시작 함수 수정
function restartGame() {
    // 게임 상태 초기화
    isGameActive = true;
    isSoundControlActive = false;
    isGameOver = false;
    
    console.log('게임 재시작 - 재시작 전 최고 점수:', highScore);
    
    // 현재 최고 점수 저장
    const currentHighScore = Math.max(score, highScore);
    if (currentHighScore > 0) {
        saveHighScoreDirectly(currentHighScore, 'restartGame');
    }
    
    // === 모든 게임 요소 완전 초기화 ===
    
    // 1. 충돌 및 게임 상태 초기화
    collisionCount = 0;
    maxLives = 5;  // 최대 목숨 초기화
    hasSecondPlane = false;
    secondPlaneTimer = 0;
    
    // 2. 모든 배열 완전 초기화
    enemies = [];           // 적 비행기 배열 초기화
    bullets = [];           // 총알 배열 초기화
    explosions = [];        // 폭발 효과 배열 초기화
    bombs = [];             // 폭탄 배열 초기화
    dynamites = [];         // 다이나마이트 배열 초기화
    powerUps = [];          // 파워업 배열 초기화
    snakeEnemies = [];      // 뱀 패턴 적 배열 초기화
    snakeGroups = [];       // 뱀 패턴 그룹 배열 초기화
    
    // 3. 플레이어 위치 초기화
    player.x = canvas.width / 2;
    player.y = canvas.height - 50;
    secondPlane.x = canvas.width / 2 - 60;
    secondPlane.y = canvas.height - 50;
    
    // 4. 게임 타이머 및 상태 초기화
    gameOverStartTime = null;
    flashTimer = 0;
    lastEnemySpawnTime = 0;
    lastBossSpawnTime = Date.now();
    
    // 5. 점수 및 레벨 초기화
    score = 0;
    levelScore = 0;
    scoreForSpread = 0;
    gameLevel = 1;
    levelUpScore = 1000;
    
    // 6. 특수무기 관련 상태 초기화
    specialWeaponCharged = false;
    specialWeaponCharge = 0;
    
    // 7. 보스 관련 상태 완전 초기화
    bossActive = false;
    bossHealth = 0;
    bossDestroyed = false;
    bossPattern = 0;
    
    // 8. 뱀 패턴 상태 초기화
    isSnakePatternActive = false;
    snakePatternTimer = 0;
    snakePatternInterval = 0;
    lastSnakeGroupTime = 0;
    
    // 9. 파워업 상태 초기화
    hasSpreadShot = false;
    hasShield = false;
    damageMultiplier = 1;
    fireRateMultiplier = 1;
    
    // 10. 발사 관련 상태 초기화
    lastFireTime = 0;
    isSpacePressed = false;
    spacePressTime = 0;
    fireDelay = 600;
    continuousFireDelay = 50;
    bulletSpeed = 12 * mobileSpeedMultiplier;
    baseBulletSize = 4.5;
    isContinuousFire = false;
    canFire = true;
    lastReleaseTime = 0;
    singleShotCooldown = 500;
    minPressDuration = 200;
    minReleaseDuration = 100;
    
    // 11. 키보드 입력 상태 초기화
    Object.keys(keys).forEach(key => {
        keys[key] = false;
    });
    
    // 12. 게임 화면 상태 초기화
    isStartScreen = false;
    isPaused = false;
    
    // 13. 사운드 관련 상태 초기화
    lastCollisionTime = 0;
    lastExplosionTime = 0;
    
    // 14. 패턴 추적 시스템 초기화
    levelBossPatterns.usedPatterns = [];
    levelBossPatterns.currentLevelPattern = null;
    
    // 15. 캔버스 포커스 설정
    setTimeout(() => {
        document.getElementById('gameCanvas').focus();
    }, 100);
    
    // 16. 게임 시작 상태 설정
    gameStarted = true;
    
    console.log('게임 재시작 완료 - 모든 요소 초기화됨');
    console.log('현재 최고 점수:', highScore);
    console.log('초기화된 상태:', {
        enemies: enemies.length,
        bullets: bullets.length,
        explosions: explosions.length,
        bombs: bombs.length,
        dynamites: dynamites.length,
        powerUps: powerUps.length,
        snakeGroups: snakeGroups.length,
        bossActive: bossActive,
        isSnakePatternActive: isSnakePatternActive
    });
}

// 적 생성 함수 수정
function createEnemy() {
    const currentDifficulty = difficultySettings[Math.min(gameLevel, 5)] || {
        enemySpeed: 6 + (gameLevel - 5) * 0.5,
        enemySpawnRate: 0.06 + (gameLevel - 5) * 0.01,
        horizontalSpeedRange: 6 + (gameLevel - 5) * 0.5,
        patternChance: 1.0,
        maxEnemies: 20 + (gameLevel - 5) * 2,
        bossHealth: 2000 + (gameLevel - 5) * 500,
        bossSpawnInterval: 10000, // 10초로 고정
        powerUpChance: 0.3,
        bombDropChance: 0.3,
        dynamiteDropChance: 0.25
    };
    
    // 뱀 패턴 시작 확률 (난이도에 따라 증가)
    if (!isSnakePatternActive && Math.random() < currentDifficulty.patternChance * 0.5) {
        startSnakePattern();
    }

    // 패턴 선택 확률 조정
    const patterns = Object.values(ENEMY_PATTERNS);
    const enemyType = Math.random() < currentDifficulty.patternChance ? 
        patterns[Math.floor(Math.random() * patterns.length)] : ENEMY_PATTERNS.NORMAL;
    
    // 적 생성 위치 계산
    const spawnX = Math.random() * (canvas.width - 30);
    const spawnY = -30;
    
    const enemy = {
        x: spawnX,
        y: spawnY,
        width: 30,
        height: 30,
        speed: currentDifficulty.enemySpeed,
        horizontalSpeed: (Math.random() - 0.5) * currentDifficulty.horizontalSpeedRange,
        direction: Math.random() < 0.5 ? -1 : 1,
        type: enemyType,
        verticalDirection: 1,
        verticalSpeed: currentDifficulty.enemySpeed * 1.5,
        patternTimer: 0,
        patternDuration: 2000 - (gameLevel * 200),
        circleAngle: Math.random() * Math.PI * 2,
        circleRadius: 50 + (gameLevel * 10),
        circleCenterX: spawnX,
        circleCenterY: spawnY,
        diagonalDirection: Math.random() < 0.5 ? 1 : -1,
        diveSpeed: currentDifficulty.enemySpeed * 2.5,
        isDiving: false,
        originalY: spawnY,
        spiralAngle: 0,
        spiralRadius: 30,
        waveAngle: 0,
        waveAmplitude: 50,
        waveFrequency: 0.02,
        vFormationOffset: 0,
        vFormationAngle: Math.PI / 4,
        randomDirectionChangeTimer: 0,
        lastUpdateTime: Date.now(),
        canDropBomb: Math.random() < currentDifficulty.bombDropChance,
        canDropDynamite: Math.random() < currentDifficulty.dynamiteDropChance,
        lastBombDrop: 0,
        lastDynamiteDrop: 0,
        bombDropInterval: 2000 + Math.random() * 3000,
        dynamiteDropInterval: 3000 + Math.random() * 4000,
        // 새로운 역동적인 속성들 추가
        bounceHeight: 100 + Math.random() * 50,
        bounceSpeed: 0.05 + Math.random() * 0.05,
        bounceAngle: 0,
        chaseSpeed: currentDifficulty.enemySpeed * 1.2,
        figureEightAngle: 0,
        figureEightRadius: 40 + Math.random() * 20,
        pendulumAngle: Math.random() * Math.PI * 2,
        pendulumSpeed: 0.03 + Math.random() * 0.02,
        pendulumAmplitude: 60 + Math.random() * 40,
        vortexAngle: 0,
        vortexRadius: 30 + Math.random() * 20,
        vortexSpeed: 0.04 + Math.random() * 0.03,
        teleportTimer: 0,
        teleportInterval: 3000 + Math.random() * 2000,
        mirrorOffset: Math.random() * canvas.width,
        accelerateTimer: 0,
        accelerateInterval: 2000 + Math.random() * 3000,
        baseSpeed: currentDifficulty.enemySpeed,
        maxSpeed: currentDifficulty.enemySpeed * 3,
        currentSpeed: currentDifficulty.enemySpeed
    };
    enemies.push(enemy);
    
    // 파워업 아이템 생성 확률 (난이도에 따라 증가)
    if (Math.random() < currentDifficulty.powerUpChance) {
        createPowerUp();
    }
}

// 적 위치 업데이트 함수 수정
function updateEnemyPosition(enemy) {
    const currentTime = Date.now();
    const deltaTime = currentTime - enemy.lastUpdateTime;
    enemy.lastUpdateTime = currentTime;
    
    // 적군이 화면 상단에 머무르지 않도록 기본 하강 속도 추가
    const baseSpeed = enemy.speed || 2;
    
    switch(enemy.type) {
        case ENEMY_PATTERNS.ZIGZAG:
            // 지그재그 패턴 - 더 역동적으로 개선
            enemy.x += Math.sin(enemy.y * 0.08) * enemy.speed * 3;
            enemy.y += baseSpeed * 1.2;
            break;
            
        case ENEMY_PATTERNS.CIRCLE:
            // 원형 회전 패턴 - 더 빠르고 역동적으로
            enemy.circleAngle += 0.08;
            enemy.x = enemy.circleCenterX + Math.cos(enemy.circleAngle) * enemy.circleRadius;
            enemy.y = enemy.circleCenterY + Math.sin(enemy.circleAngle) * enemy.circleRadius + baseSpeed * 1.5;
            break;
            
        case ENEMY_PATTERNS.DIAGONAL:
            // 대각선 다이빙 패턴 - 더 급격하게
            if (!enemy.isDiving) {
                enemy.x += enemy.diagonalDirection * enemy.speed * 1.5;
                enemy.y += baseSpeed * 0.8;
                if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
                    enemy.isDiving = true;
                    enemy.originalY = enemy.y;
                }
            } else {
                enemy.y += enemy.diveSpeed * 1.3;
                if (enemy.y >= enemy.originalY + 250) {
                    enemy.isDiving = false;
                    enemy.diagonalDirection *= -1;
                }
            }
            break;
            
        case ENEMY_PATTERNS.SPIRAL:
            // 나선형 패턴 - 더 복잡하게
            enemy.spiralAngle += 0.08;
            enemy.spiralRadius += 0.8;
            enemy.x = enemy.circleCenterX + Math.cos(enemy.spiralAngle) * enemy.spiralRadius;
            enemy.y = enemy.circleCenterY + Math.sin(enemy.spiralAngle) * enemy.spiralRadius + baseSpeed * 1.3;
            break;
            
        case ENEMY_PATTERNS.WAVE:
            // 파도형 패턴 - 더 큰 진폭으로
            enemy.waveAngle += enemy.waveFrequency * 1.5;
            enemy.x += Math.sin(enemy.waveAngle) * enemy.waveAmplitude * 0.15;
            enemy.y += baseSpeed * 1.1;
            break;
            
        case ENEMY_PATTERNS.CROSS:
            // 십자형 패턴 - 더 빠른 방향 전환
            if (currentTime - enemy.patternTimer >= enemy.patternDuration * 0.7) {
                enemy.patternTimer = currentTime;
                enemy.direction *= -1;
            }
            enemy.x += enemy.speed * enemy.direction * 1.4;
            enemy.y += baseSpeed * 1.2;
            break;
            
        case ENEMY_PATTERNS.V_SHAPE:
            // V자형 패턴 - 더 역동적으로
            enemy.vFormationOffset += 0.15;
            enemy.x += Math.cos(enemy.vFormationAngle) * enemy.speed * 1.3;
            enemy.y += baseSpeed * 1.1;
            enemy.vFormationAngle += Math.sin(enemy.vFormationOffset) * 0.03;
            break;
            
        case ENEMY_PATTERNS.RANDOM:
            // 랜덤 패턴 - 더 자주 방향 변경
            if (currentTime - enemy.randomDirectionChangeTimer >= 800) {
                enemy.randomDirectionChangeTimer = currentTime;
                enemy.direction = Math.random() < 0.5 ? -1 : 1;
                enemy.verticalDirection = Math.random() < 0.5 ? -1 : 1;
            }
            enemy.x += enemy.speed * enemy.direction * 1.2;
            enemy.y += baseSpeed * 1.1;
            break;
            
        case ENEMY_PATTERNS.BOUNCE:
            // 튀어오르는 패턴
            enemy.bounceAngle += enemy.bounceSpeed;
            enemy.x += Math.sin(enemy.bounceAngle) * enemy.speed * 2;
            enemy.y += baseSpeed + Math.abs(Math.sin(enemy.bounceAngle)) * 2;
            break;
            
        case ENEMY_PATTERNS.CHASE:
            // 플레이어 추적 패턴
            const targetX = player.x;
            const targetY = player.y;
            const dx = targetX - enemy.x;
            const dy = targetY - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                enemy.x += (dx / distance) * enemy.chaseSpeed;
                enemy.y += (dy / distance) * enemy.chaseSpeed;
            }
            break;
            
        case ENEMY_PATTERNS.FIGURE_EIGHT:
            // 8자 패턴
            enemy.figureEightAngle += 0.06;
            const t = enemy.figureEightAngle;
            enemy.x = enemy.circleCenterX + Math.sin(t) * enemy.figureEightRadius;
            enemy.y = enemy.circleCenterY + Math.sin(t) * Math.cos(t) * enemy.figureEightRadius + baseSpeed;
            break;
            
        case ENEMY_PATTERNS.PENDULUM:
            // 진자 패턴
            enemy.pendulumAngle += enemy.pendulumSpeed;
            enemy.x = enemy.circleCenterX + Math.sin(enemy.pendulumAngle) * enemy.pendulumAmplitude;
            enemy.y += baseSpeed * 1.2;
            break;
            
        case ENEMY_PATTERNS.VORTEX:
            // 소용돌이 패턴
            enemy.vortexAngle += enemy.vortexSpeed;
            enemy.vortexRadius += 0.3;
            enemy.x = enemy.circleCenterX + Math.cos(enemy.vortexAngle) * enemy.vortexRadius;
            enemy.y = enemy.circleCenterY + Math.sin(enemy.vortexAngle) * enemy.vortexRadius + baseSpeed;
            break;
            
        case ENEMY_PATTERNS.TELEPORT:
            // 순간이동 패턴
            enemy.y += baseSpeed;
            if (currentTime - enemy.teleportTimer >= enemy.teleportInterval) {
                enemy.teleportTimer = currentTime;
                enemy.x = Math.random() * (canvas.width - enemy.width);
                enemy.y = Math.max(enemy.y - 100, 0); // 위로 순간이동
            }
            break;
            
        case ENEMY_PATTERNS.MIRROR:
            // 거울 패턴 (플레이어 반대 방향)
            const mirrorX = canvas.width - player.x;
            const targetMirrorX = mirrorX + (enemy.mirrorOffset - canvas.width / 2);
            const dxMirror = targetMirrorX - enemy.x;
            enemy.x += dxMirror * 0.02;
            enemy.y += baseSpeed * 1.1;
            break;
            
        case ENEMY_PATTERNS.ACCELERATE:
            // 가속 패턴
            if (currentTime - enemy.accelerateTimer >= enemy.accelerateInterval) {
                enemy.accelerateTimer = currentTime;
                enemy.currentSpeed = Math.min(enemy.currentSpeed * 1.5, enemy.maxSpeed);
            }
            enemy.x += Math.sin(enemy.y * 0.05) * enemy.currentSpeed;
            enemy.y += enemy.currentSpeed;
            break;
            
        default: // NORMAL
            // 기본 패턴도 약간의 랜덤성 추가
            enemy.x += Math.sin(enemy.y * 0.03) * enemy.speed * 0.5;
            enemy.y += baseSpeed;
    }
    
    // 화면 경계 체크 및 반전
    if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
        enemy.direction *= -1;
    }
    if (enemy.y <= 0 || enemy.y >= canvas.height - enemy.height) {
        enemy.verticalDirection *= -1;
    }
    
    // 폭탄 투하 체크
    if (enemy.canDropBomb && currentTime - enemy.lastBombDrop >= enemy.bombDropInterval) {
        createBomb(enemy);
        enemy.lastBombDrop = currentTime;
    }
    
    // 다이나마이트 투하 체크
    if (enemy.canDropDynamite && currentTime - enemy.lastDynamiteDrop >= enemy.dynamiteDropInterval) {
        createDynamite(enemy);
        enemy.lastDynamiteDrop = currentTime;
    }
}

// 패턴 타입 상수 수정
const PATTERN_TYPES = {
    SNAKE: 'snake',      // S자 움직임
    VERTICAL: 'vertical', // 세로 움직임
    DIAGONAL: 'diagonal', // 대각선 움직임
    HORIZONTAL: 'horizontal', // 가로 움직임
    SPIRAL: 'spiral',     // 나선형 움직임
    // 새로운 역동적인 뱀 패턴들 추가
    WAVE: 'wave',         // 파도형 움직임
    ZIGZAG: 'zigzag',     // 지그재그 움직임
    CIRCLE: 'circle',     // 원형 움직임
    VORTEX: 'vortex',     // 소용돌이 움직임
    CHASE: 'chase',       // 플레이어 추적 움직임
    BOUNCE: 'bounce',     // 튀어오르는 움직임
    MIRROR: 'mirror'      // 거울 움직임
};

// 뱀 패턴 시작 함수 수정
function startSnakePattern() {
    isSnakePatternActive = true;
    snakePatternTimer = Date.now();
    
    // 새로운 뱀 그룹 생성
    const newGroup = {
        enemies: [],
        startTime: Date.now(),
        patternInterval: 0,
        isActive: true,
        startX: getRandomStartPosition(),
        startY: -30,
        patternType: getRandomPatternType(),
        direction: Math.random() < 0.5 ? 1 : -1,
        angle: 0,
        speed: 2 + Math.random() * 2, // 속도 랜덤화
        amplitude: Math.random() * 100 + 150,
        frequency: Math.random() * 0.5 + 0.75,
        spiralRadius: 50,
        spiralAngle: 0,
        initialEnemiesCreated: false,
        // 새로운 역동적인 속성들 추가
        waveAngle: 0,
        waveAmplitude: 80 + Math.random() * 60,
        waveFrequency: 0.03 + Math.random() * 0.02,
        zigzagAngle: 0,
        zigzagAmplitude: 60 + Math.random() * 40,
        zigzagFrequency: 0.04 + Math.random() * 0.03,
        circleRadius: 40 + Math.random() * 30,
        circleAngle: 0,
        circleSpeed: 0.05 + Math.random() * 0.03,
        vortexRadius: 30 + Math.random() * 20,
        vortexAngle: 0,
        vortexSpeed: 0.06 + Math.random() * 0.04,
        chaseSpeed: 3 + Math.random() * 2,
        bounceHeight: 50 + Math.random() * 30,
        bounceSpeed: 0.08 + Math.random() * 0.05,
        bounceAngle: 0,
        mirrorOffset: Math.random() * canvas.width,
        patternChangeTimer: 0,
        patternChangeInterval: 5000 + Math.random() * 3000, // 패턴 변경 간격
        currentSpeed: 2 + Math.random() * 2,
        maxSpeed: 5 + Math.random() * 3
    };
    
    // 첫 번째 적 생성
    const firstEnemy = {
        x: newGroup.startX,
        y: newGroup.startY,
        width: 30,
        height: 30,
        speed: newGroup.speed,
        type: 'snake',
        targetX: newGroup.startX,
        targetY: newGroup.startY,
        angle: 0,
        isHit: false,
        amplitude: newGroup.amplitude,
        frequency: newGroup.frequency,
        lastChange: Date.now(),
        // 새로운 속성들 추가
        waveAngle: newGroup.waveAngle,
        zigzagAngle: newGroup.zigzagAngle,
        circleAngle: newGroup.circleAngle,
        vortexAngle: newGroup.vortexAngle,
        bounceAngle: newGroup.bounceAngle,
        currentSpeed: newGroup.currentSpeed
    };
    newGroup.enemies.push(firstEnemy);
    snakeGroups.push(newGroup);
}

// 그룹별 시작 위치 계산 함수 추가
function getRandomStartPosition() {
    // 화면을 4등분하여 각 구역별로 다른 시작 위치 설정
    const section = Math.floor(Math.random() * 4);
    const sectionWidth = canvas.width / 4;
    
    switch(section) {
        case 0: // 왼쪽 구역
            return Math.random() * (sectionWidth * 0.5) + 50;
        case 1: // 중앙 왼쪽 구역
            return Math.random() * (sectionWidth * 0.5) + sectionWidth;
        case 2: // 중앙 오른쪽 구역
            return Math.random() * (sectionWidth * 0.5) + sectionWidth * 2;
        case 3: // 오른쪽 구역
            return Math.random() * (sectionWidth * 0.5) + sectionWidth * 3;
    }
}

// 랜덤 패턴 타입 선택 함수 추가
function getRandomPatternType() {
    const types = Object.values(PATTERN_TYPES);
    return types[Math.floor(Math.random() * types.length)];
}

// 충돌 감지 함수 수정
function checkCollision(rect1, rect2) {
    // 충돌 영역을 더 정확하게 계산
    const margin = 2;  // 충돌 마진을 줄임
    return rect1.x + margin < rect2.x + rect2.width - margin &&
           rect1.x + rect1.width - margin > rect2.x + margin &&
           rect1.y + margin < rect2.y + rect2.height - margin &&
           rect1.y + rect1.height - margin > rect2.y + margin;
}

// 충돌 처리 함수 수정
function handleCollision() {
    if (hasShield) {
        hasShield = false;
        return;
    }
    
    const currentTime = Date.now();
    collisionCount++;
    flashTimer = flashDuration;
    
    if (currentTime - lastCollisionTime >= collisionSoundCooldown) {
        collisionSound.currentTime = 0;
        explosionSound.currentTime = 0;
        explosionSound.play().catch(error => {
            console.log('오디오 재생 실패:', error);
        });
        lastCollisionTime = currentTime;
    }
    
    if (collisionCount >= maxLives) {  // maxLives 사용
        handleGameOver();
        
        // 폭발 효과
        explosions.push(new Explosion(
            player.x + player.width/2,
            player.y + player.height/2,
            true
        ));
        
        // 주변 폭발 효과
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const distance = 60;
            explosions.push(new Explosion(
                player.x + player.width/2 + Math.cos(angle) * distance,
                player.y + player.height/2 + Math.sin(angle) * distance,
                false
            ));
        }
        
        if (hasSecondPlane) {
            explosions.push(new Explosion(
                secondPlane.x + secondPlane.width/2,
                secondPlane.y + secondPlane.height/2,
                true
            ));
            
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 / 12) * i;
                const distance = 60;
                explosions.push(new Explosion(
                    secondPlane.x + secondPlane.width/2 + Math.cos(angle) * distance,
                    secondPlane.y + secondPlane.height/2 + Math.sin(angle) * distance,
                    false
                ));
            }
        }
        
        // 게임 오버 시 폭발음 재생
        explosionSound.currentTime = 0;
        explosionSound.play().catch(error => {
            console.log('오디오 재생 실패:', error);
        });
    }
}

// 폭발 효과 클래스
class Explosion {
    constructor(x, y, isFinal = false) {
        this.x = x;
        this.y = y;
        this.radius = 1;
        this.maxRadius = isFinal ? 100 : 50; // 최종 폭발은 더 크게
        this.speed = isFinal ? 1 : 1.5;
        this.particles = [];
        this.isFinal = isFinal;
        
        // 파티클 생성
        if (isFinal) {
            for (let i = 0; i < 20; i++) {
                this.particles.push({
                    x: this.x,
                    y: this.y,
                    speed: Math.random() * 8 + 2,
                    angle: (Math.PI * 2 / 20) * i,
                    size: Math.random() * 4 + 2,
                    life: 1
                });
            }
        }

        // 폭발 시 주변 적에게 데미지
        if (isFinal) {
            enemies.forEach(enemy => {
                const dx = enemy.x + enemy.width/2 - this.x;
                const dy = enemy.y + enemy.height/2 - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 폭발 반경 내의 적에게 데미지
                if (distance < this.maxRadius) {
                    if (enemy.isBoss) {
                        enemy.health -= 200; // 보스는 200 데미지
                        bossHealth = enemy.health;
                    } else {
                        // 일반 적은 즉시 파괴
                        explosions.push(new Explosion(
                            enemy.x + enemy.width/2,
                            enemy.y + enemy.height/2
                        ));
                        updateScore(20);
                    }
                }
            });
        }
    }

    update() {
        this.radius += this.speed;
        
        if (this.isFinal) {
            // 파티클 업데이트
            for (let particle of this.particles) {
                particle.x += Math.cos(particle.angle) * particle.speed;
                particle.y += Math.sin(particle.angle) * particle.speed;
                particle.life -= 0.02;
                particle.size *= 0.98;
            }
            
            // 파티클이 모두 사라졌는지 확인
            return this.particles.some(p => p.life > 0);
        }
        
        return this.radius < this.maxRadius;
    }

    draw() {
        if (this.isFinal) {
            // 중심 폭발
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.radius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
            gradient.addColorStop(0.4, 'rgba(255, 100, 0, 0.6)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // 파티클 그리기
            for (let particle of this.particles) {
                if (particle.life > 0) {
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, ${Math.floor(200 * particle.life)}, 0, ${particle.life})`;
                    ctx.fill();
                    
                    // 파티클 꼬리 효과
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(
                        particle.x - Math.cos(particle.angle) * (particle.speed * 4),
                        particle.y - Math.sin(particle.angle) * (particle.speed * 4)
                    );
                    ctx.strokeStyle = `rgba(255, ${Math.floor(100 * particle.life)}, 0, ${particle.life * 0.5})`;
                    ctx.lineWidth = particle.size * 0.8;
                    ctx.stroke();
                }
            }
        } else {
            // 일반 폭발 효과
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 200, 0, ${1 - this.radius / this.maxRadius})`;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 100, 0, ${1 - this.radius / this.maxRadius})`;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 50, 0, ${1 - this.radius / this.maxRadius})`;
            ctx.fill();
        }
    }
}

// 비행기 그리기 함수
function drawAirplane(x, y, width, height, color, isEnemy = false) {
    ctx.save();
    ctx.translate(x + width/2, y + height/2);
    if (isEnemy) {
        ctx.rotate(Math.PI); // 적 비행기는 180도 회전
    }
    
    // 그림자 효과 제거
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // 메인 날개 (가오리 날개 모양)
    ctx.beginPath();
    ctx.moveTo(0, -height/2); // 기수
    ctx.lineTo(width/2, -height/4); // 오른쪽 날개 앞
    ctx.lineTo(width/2, height/4); // 오른쪽 날개 중간
    ctx.lineTo(width/3, height/2); // 오른쪽 날개 뒤
    ctx.lineTo(0, height/3); // 꼬리 시작
    ctx.lineTo(-width/3, height/2); // 왼쪽 날개 뒤
    ctx.lineTo(-width/2, height/4); // 왼쪽 날개 중간
    ctx.lineTo(-width/2, -height/4); // 왼쪽 날개 앞
    ctx.closePath();
    ctx.fillStyle = isEnemy ? 'red' : 'rgb(255, 255, 255)';  // 적은 빨간색, 아군은 순수한 흰색
    ctx.fill();

    // 꼬리
    ctx.beginPath();
    ctx.moveTo(0, height/3);
    ctx.lineTo(width/8, height/2);
    ctx.lineTo(0, height);
    ctx.lineTo(-width/8, height/2);
    ctx.closePath();
    ctx.fillStyle = isEnemy ? 'red' : 'rgb(255, 255, 255)';  // 적은 빨간색, 아군은 순수한 흰색
    ctx.fill();

    // 동체
    ctx.beginPath();
    ctx.moveTo(0, -height/2); // 기수
    ctx.lineTo(width/8, -height/3);
    ctx.lineTo(width/8, height/3);
    ctx.lineTo(0, height/3);
    ctx.lineTo(-width/8, height/3);
    ctx.lineTo(-width/8, -height/3);
    ctx.closePath();
    ctx.fillStyle = isEnemy ? '#900' : 'rgb(255, 255, 255)';  // 적은 어두운 빨간색, 아군은 순수한 흰색
    ctx.fill();

    // 눈
    ctx.beginPath();
    ctx.arc(-width/6, -height/3, width/20, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(width/6, -height/3, width/20, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    // 입
    ctx.beginPath();
    ctx.moveTo(-width/12, -height/4);
    ctx.lineTo(width/12, -height/4);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 날개 디테일
    ctx.beginPath();
    ctx.moveTo(-width/2, -height/8);
    ctx.lineTo(-width/2, height/8);
    ctx.strokeStyle = isEnemy ? '#800' : 'rgb(255, 255, 255)';  // 적은 어두운 빨간색, 아군은 순수한 흰색
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width/2, -height/8);
    ctx.lineTo(width/2, height/8);
    ctx.stroke();

    // 날개 앞쪽 디테일
    ctx.beginPath();
    ctx.moveTo(-width/2, -height/4);
    ctx.lineTo(-width/2 + width/8, -height/5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width/2, -height/4);
    ctx.lineTo(width/2 - width/8, -height/5);
    ctx.stroke();

    // 날개 뒤쪽 디테일
    ctx.beginPath();
    ctx.moveTo(-width/3, height/2);
    ctx.lineTo(-width/3 + width/8, height/3);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width/3, height/2);
    ctx.lineTo(width/3 - width/8, height/3);
    ctx.stroke();

    // 꼬리 디테일
    ctx.beginPath();
    ctx.moveTo(0, height/3);
    ctx.lineTo(0, height);
    ctx.strokeStyle = isEnemy ? '#800' : 'rgb(255, 255, 255)';  // 적은 어두운 빨간색, 아군은 순수한 흰색
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

}

// 게임 루프 수정
function gameLoop() {
    if (!gameLoopRunning) return;
    
    if (isPaused) {
        if (gameLoopRunning) {
            requestAnimationFrame(gameLoop);
        }
        return;
    }

    // 화면 전체를 검정색으로 채움 (캔버스 배경)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isStartScreen) {
        drawStartScreen();
        if (gameLoopRunning) {
            requestAnimationFrame(gameLoop);
        }
        return;
    }

    if (isGameOver) {
        // 폭발 효과 업데이트 및 그리기
        explosions = explosions.filter(explosion => {
            explosion.draw();
            return explosion.update();
        });

        // 폭발 효과가 모두 사라졌을 때만 게임 오버 화면 표시
        if (explosions.length === 0) {
            // 게임 오버 화면 페이드 인 효과
            const fadeInDuration = 2000;
            const currentTime = Date.now();
            const fadeProgress = Math.min(1, (currentTime - (gameOverStartTime || currentTime)) / fadeInDuration);
            
            if (!gameOverStartTime) {
                gameOverStartTime = currentTime;
                // 게임 오버 시 최고 점수 업데이트
                ScoreManager.save();
            }

            // 배경 페이드 인 - 완전한 검정색으로 변경
            ctx.fillStyle = `rgba(0, 0, 0, ${fadeProgress})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            if (fadeProgress >= 1) {
                // 게임 오버 텍스트에 그라데이션 효과
                const gradient = ctx.createLinearGradient(0, canvas.height/2 - 50, 0, canvas.height/2 + 50);
                gradient.addColorStop(0, '#ff0000');
                gradient.addColorStop(0.5, '#ff4444');
                gradient.addColorStop(1, '#ff0000');
                
                ctx.fillStyle = gradient;
                ctx.font = 'bold 45px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 60);
                
                ctx.font = 'bold 20px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(`최종 점수: ${score}`, canvas.width/2, canvas.height/2);
                ctx.fillText(`충돌 횟수: ${collisionCount}`, canvas.width/2, canvas.height/2 + 30);
                ctx.font = 'bold 24px Arial';
                ctx.fillText('시작/재시작 버튼을 눌러 시작', canvas.width/2, canvas.height/2 + 80);

            }
        }
        if (gameLoopRunning) {
            requestAnimationFrame(gameLoop);
        }
        return;
    }

    try {

        
        // 깜박임 효과 처리
        if (flashTimer > 0) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            flashTimer -= 16;
        }

        // 플레이어 이동 처리
        handlePlayerMovement();

        // 총알 발사 처리
        handleBulletFiring();
        
        // 특수 무기 처리
        handleSpecialWeapon();

        // 적 생성 및 이동 처리
        handleEnemies();
        
        // 보스 체크 및 생성
        const currentTime = Date.now();
        if (!bossActive) {  // bossDestroyed 조건 제거
            const timeSinceLastBoss = currentTime - lastBossSpawnTime;
            
            if (timeSinceLastBoss >= BOSS_SETTINGS.SPAWN_INTERVAL) {
                createBoss();
            }
        } else {
            // 보스가 존재하는 경우 보스 패턴 처리
            const boss = enemies.find(enemy => enemy.isBoss);
            if (boss) {
                handleBossPattern(boss);
            } else {
                // 보스가 enemies 배열에서 제거된 경우 상태 초기화
                bossActive = false;
                bossHealth = 0;
                bossDestroyed = false;  // 보스 파괴 상태 초기화
            }
        }

        // 총알 이동 및 충돌 체크
        handleBullets();

        // 확산탄 처리
        handleSpreadShot();

        // 두 번째 비행기 처리
        handleSecondPlane();

        // 레벨업 체크
        checkLevelUp();

        // 폭발 효과 업데이트 및 그리기
        handleExplosions();

        // 폭탄 처리 추가
        handleBombs();

        // 다이나마이트 처리 추가
        handleDynamites();

        // UI 그리기
        drawUI();

        // 프레임 레이트 제한 (30 FPS)
        if (gameLoopRunning) {
            requestAnimationFrame(gameLoop);
        }
    } catch (error) {
        console.error('게임 루프 실행 중 오류:', error);
        // 오류 발생 시 게임 오버 처리
        handleGameOver();
    }
}

// 플레이어 이동 처리 함수
function handlePlayerMovement() {
    if (keys.ArrowLeft && player.x > -player.width/2) {
        player.x -= player.speed * 0.5;
        if (hasSecondPlane) {
            secondPlane.x -= player.speed * 0.5;
        }
    }
    if (keys.ArrowRight && player.x < canvas.width - player.width/2) {
        player.x += player.speed * 0.5;
        if (hasSecondPlane) {
            secondPlane.x += player.speed * 0.5;
        }
    }
    if (keys.ArrowUp && player.y > 0) {
        player.y -= player.speed;
        if (hasSecondPlane) {
            secondPlane.y -= player.speed;
        }
    }
    if (keys.ArrowDown && player.y < canvas.height - player.height) {
        player.y += player.speed;
        if (hasSecondPlane) {
            secondPlane.y += player.speed;
        }
    }
}

// 적 처리 함수 수정
function handleEnemies() {
    const currentTime = Date.now();
    const currentDifficulty = difficultySettings[Math.min(gameLevel, 5)] || {
        enemySpeed: 6 + (gameLevel - 5) * 0.5,
        enemySpawnRate: 0.06 + (gameLevel - 5) * 0.01,
        horizontalSpeedRange: 6 + (gameLevel - 5) * 0.5,
        patternChance: 1.0,
        maxEnemies: 20 + (gameLevel - 5) * 2,
        bossHealth: 2000 + (gameLevel - 5) * 500,
        bossSpawnInterval: 10000, // 10초로 고정
        powerUpChance: 0.3,
        bombDropChance: 0.3,
        dynamiteDropChance: 0.25
    };

    // 뱀 패턴 처리
    if (isSnakePatternActive) {
        handleSnakePattern();
    }

    // 일반 적 생성 - 시간 기반 생성 로직으로 변경
    if (currentTime - lastEnemySpawnTime >= MIN_ENEMY_SPAWN_INTERVAL &&
        Math.random() < currentDifficulty.enemySpawnRate && 
        enemies.length < currentDifficulty.maxEnemies &&
        !isGameOver) {
        createEnemy();
        lastEnemySpawnTime = currentTime;
    }

    // 일반 적 이동 및 충돌 체크
    enemies = enemies.filter(enemy => {
        // 적 비행기 위치 업데이트
        updateEnemyPosition(enemy);
        
        // 새로운 위치에 적 비행기 그리기
        drawAirplane(enemy.x, enemy.y, enemy.width, enemy.height, 'red', true);
        
        // 충돌 체크 및 화면 밖 체크
        return checkEnemyCollisions(enemy);
    });
}

// 뱀 패턴 처리 함수 수정
function handleSnakePattern() {
    const currentTime = Date.now();
    
    // 새로운 그룹 생성 체크
    if (currentTime - lastSnakeGroupTime >= snakeGroupInterval && 
        snakeGroups.length < maxSnakeGroups) {
        lastSnakeGroupTime = currentTime;
        startSnakePattern();
    }
    
    // 각 그룹 처리
    snakeGroups = snakeGroups.filter(group => {
        if (!group.isActive) return false;
        
        // 그룹의 지속 시간 체크
        if (currentTime - group.startTime >= snakePatternDuration) {
            group.isActive = false;
            return false;
        }
        
        // 초기 비행기 생성 (그룹이 시작될 때 한 번만)
        if (!group.initialEnemiesCreated) {
            if (currentTime - group.patternInterval >= 300 && group.enemies.length < 10) {
                group.patternInterval = currentTime;
                const lastEnemy = group.enemies[group.enemies.length - 1];
                const newEnemy = {
                    x: lastEnemy.x,
                    y: lastEnemy.y,
                    width: 30,
                    height: 30,
                    speed: group.speed,
                    type: 'snake',
                    targetX: lastEnemy.x,
                    targetY: lastEnemy.y,
                    angle: lastEnemy.angle,
                    isHit: false,
                    amplitude: group.amplitude,
                    frequency: group.frequency
                };
                group.enemies.push(newEnemy);
            }
            
            if (group.enemies.length >= 10) {
                group.initialEnemiesCreated = true;
            }
        }
        
        // 그룹 내 적군 이동
        group.enemies.forEach((enemy, index) => {
            if (index === 0) {
                // 패턴 변경 체크
                if (currentTime - group.patternChangeTimer >= group.patternChangeInterval) {
                    group.patternType = getRandomPatternType();
                    group.patternChangeTimer = currentTime;
                    group.currentSpeed = Math.min(group.currentSpeed * 1.2, group.maxSpeed);
                }
                
                // 첫 번째 적의 이동 패턴
                switch(group.patternType) {
                    case PATTERN_TYPES.SNAKE:
                        // S자 움직임 - 더 역동적으로 개선
                        enemy.angle += 0.05;
                        const baseX = group.startX;
                        const waveX = Math.sin(enemy.angle * group.frequency) * group.amplitude;
                        enemy.x = baseX + waveX;
                        enemy.y += enemy.speed * 1.3;
                        break;
                        
                    case PATTERN_TYPES.VERTICAL:
                        // 세로 움직임 - 약간의 흔들림 추가
                        enemy.y += enemy.speed * 1.2;
                        enemy.x = group.startX + Math.sin(enemy.angle) * 50;
                        enemy.angle += 0.03;
                        break;
                        
                    case PATTERN_TYPES.DIAGONAL:
                        // 대각선 움직임 - 더 급격하게
                        enemy.x += enemy.speed * group.direction * 1.5;
                        enemy.y += enemy.speed * 1.3;
                        if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
                            group.direction *= -1;
                            enemy.y += 30;
                        }
                        break;
                        
                    case PATTERN_TYPES.HORIZONTAL:
                        // 가로 움직임 - 더 역동적으로
                        enemy.x += enemy.speed * group.direction * 1.4;
                        enemy.y = group.startY + Math.sin(enemy.angle) * 60;
                        enemy.angle += 0.04;
                        if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
                            group.direction *= -1;
                            group.startY += 40;
                        }
                        break;
                        
                    case PATTERN_TYPES.SPIRAL:
                        // 나선형 움직임 - 더 복잡하게
                        group.spiralAngle += 0.08;
                        group.spiralRadius += 0.8;
                        enemy.x = group.startX + Math.cos(group.spiralAngle) * group.spiralRadius;
                        enemy.y = group.startY + Math.sin(group.spiralAngle) * group.spiralRadius;
                        break;
                        
                    case PATTERN_TYPES.WAVE:
                        // 파도형 움직임
                        group.waveAngle += group.waveFrequency;
                        enemy.x = group.startX + Math.sin(group.waveAngle) * group.waveAmplitude;
                        enemy.y += enemy.speed * 1.1;
                        break;
                        
                    case PATTERN_TYPES.ZIGZAG:
                        // 지그재그 움직임
                        group.zigzagAngle += group.zigzagFrequency;
                        enemy.x = group.startX + Math.sin(group.zigzagAngle) * group.zigzagAmplitude;
                        enemy.y += enemy.speed * 1.4;
                        break;
                        
                    case PATTERN_TYPES.CIRCLE:
                        // 원형 움직임
                        group.circleAngle += group.circleSpeed;
                        enemy.x = group.startX + Math.cos(group.circleAngle) * group.circleRadius;
                        enemy.y = group.startY + Math.sin(group.circleAngle) * group.circleRadius;
                        group.startY += enemy.speed * 0.5;
                        break;
                        
                    case PATTERN_TYPES.VORTEX:
                        // 소용돌이 움직임
                        group.vortexAngle += group.vortexSpeed;
                        group.vortexRadius += 0.5;
                        enemy.x = group.startX + Math.cos(group.vortexAngle) * group.vortexRadius;
                        enemy.y = group.startY + Math.sin(group.vortexAngle) * group.vortexRadius;
                        group.startY += enemy.speed * 0.3;
                        break;
                        
                    case PATTERN_TYPES.CHASE:
                        // 플레이어 추적 움직임
                        const targetX = player.x;
                        const targetY = player.y;
                        const dx = targetX - enemy.x;
                        const dy = targetY - enemy.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance > 0) {
                            enemy.x += (dx / distance) * group.chaseSpeed;
                            enemy.y += (dy / distance) * group.chaseSpeed;
                        }
                        break;
                        
                    case PATTERN_TYPES.BOUNCE:
                        // 튀어오르는 움직임
                        group.bounceAngle += group.bounceSpeed;
                        enemy.x = group.startX + Math.sin(group.bounceAngle) * group.bounceHeight;
                        enemy.y += enemy.speed + Math.abs(Math.sin(group.bounceAngle)) * 3;
                        break;
                        
                    case PATTERN_TYPES.MIRROR:
                        // 거울 움직임 (플레이어 반대 방향)
                        const mirrorX = canvas.width - player.x;
                        const targetMirrorX = mirrorX + (group.mirrorOffset - canvas.width / 2);
                        const dxMirror = targetMirrorX - enemy.x;
                        enemy.x += dxMirror * 0.03;
                        enemy.y += enemy.speed * 1.2;
                        break;
                }
            } else {
                // 뒤따르는 적들의 움직임 - 더 자연스럽게 개선
                const prevEnemy = group.enemies[index - 1];
                const dx = prevEnemy.x - enemy.x;
                const dy = prevEnemy.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const targetDistance = 30 + index * 2; // 거리를 약간씩 늘려서 더 자연스럽게
                if (distance > targetDistance) {
                    const moveX = (dx / distance) * (distance - targetDistance) * 0.8;
                    const moveY = (dy / distance) * (distance - targetDistance) * 0.8;
                    enemy.x += moveX;
                    enemy.y += moveY;
                }
                
                // 뒤따르는 적들도 약간의 랜덤성 추가
                enemy.x += Math.sin(currentTime * 0.001 + index) * 0.5;
            }
            
            if (!enemy.isHit) {
                drawAirplane(enemy.x, enemy.y, enemy.width, enemy.height, 'red', true);
            }
        });
        
        // 충돌 체크
        let collisionOccurred = false;
        group.enemies.forEach((enemy, index) => {
            if (!enemy.isHit && !collisionOccurred) {
                bullets = bullets.filter(bullet => {
                    if (checkCollision(bullet, enemy)) {
                        explosions.push(new Explosion(
                            enemy.x + enemy.width/2,
                            enemy.y + enemy.height/2
                        ));
                        updateScore(20); //뱀 패턴 비행기 한 대당 획득 점수
                        playExplosionSound(true); // 뱀패턴 효과음으로 설정
                        enemy.isHit = true;
                        return false;
                    }
                    return true;
                });
                
                if (!collisionOccurred && (checkCollision(player, enemy) || 
                    (hasSecondPlane && checkCollision(secondPlane, enemy)))) {
                    handleCollision();
                    explosions.push(new Explosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2));
                    enemy.isHit = true;
                    collisionOccurred = true;
                }
            }
        });
        
        // 화면 밖으로 나간 적 제거
        group.enemies = group.enemies.filter(enemy => 
            enemy.y < canvas.height + 100 && 
            enemy.y > -100 && 
            enemy.x > -100 && 
            enemy.x < canvas.width + 100
        );
        
        return group.enemies.length > 0;
    });
    
    if (snakeGroups.length === 0) {
        isSnakePatternActive = false;
    }
}

// 적 충돌 체크 함수 수정
function checkEnemyCollisions(enemy) {
    // 보스가 이미 파괴된 경우 처리하지 않음
    if (enemy.isBoss && bossDestroyed) {
        return false;
    }

    // 총알과 적 충돌 체크
    let isHit = false;
    bullets = bullets.filter(bullet => {
        // 보스 총알은 여기서 처리하지 않음
        if (bullet.isBossBullet) {
            return true;
        }

        if (checkCollision(bullet, enemy)) {
            // 보스인 경우 체력 감소
            if (enemy.isBoss) {
                const currentTime = Date.now();
                
                // 특수 무기인 경우 즉시 파괴
                if (bullet.isSpecial) {
                    console.log('보스가 특수 무기에 맞음');
                    enemy.health = 0;
                    bossHealth = 0;
                    bossDestroyed = true;
                    updateScore(BOSS_SETTINGS.BONUS_SCORE);
                    
                    // 보스 파괴 시 목숨 1개 추가
                    maxLives++; // 최대 목숨 증가
                    
                    // 큰 폭발 효과
                    explosions.push(new Explosion(
                        enemy.x + enemy.width/2,
                        enemy.y + enemy.height/2,
                        true
                    ));
                    
                    // 추가 폭발 효과
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI * 2 / 8) * i;
                        const distance = 50;
                        explosions.push(new Explosion(
                            enemy.x + enemy.width/2 + Math.cos(angle) * distance,
                            enemy.y + enemy.height/2 + Math.sin(angle) * distance,
                            false
                        ));
                    }
                    
                    bossActive = false;
                    return false;
                }
                
                // 일반 총알인 경우
                enemy.hitCount++;
                console.log('보스 총알 맞은 횟수:', enemy.hitCount);
                
                // 피격 시간 추적 시작
                if (!enemy.isBeingHit) {
                    enemy.isBeingHit = true;
                    enemy.lastHitTime = currentTime;
                }
                
                // 보스가 맞았을 때 시각 효과 추가
                explosions.push(new Explosion(
                    bullet.x,
                    bullet.y,
                    false
                ));
                
                // 체력 감소 (각 총알당 100의 데미지)
                enemy.health -= 100;
                bossHealth = enemy.health;
                
                // 보스 피격음 재생
                if (collisionSound && audioInitialized) {
                    try {
                        collisionSound.currentTime = 0;
                        collisionSound.play().catch(error => {
                            console.log('오디오 재생 실패:', error);
                        });
                    } catch (error) {
                        console.warn('충돌음 재생 중 오류:', error);
                    }
                }
                
                // 피격 시간이 전체 출현 시간의 50%를 넘으면 파괴
                const totalTime = currentTime - enemy.lastUpdateTime;
                const hitTimeThreshold = BOSS_SETTINGS.SPAWN_INTERVAL * 0.5;
                
                if (enemy.totalHitTime >= hitTimeThreshold) {
                    console.log('보스 파괴됨 - 피격 시간 초과:', {
                        totalHitTime: enemy.totalHitTime,
                        threshold: hitTimeThreshold
                    });
                    enemy.health = 0;
                    bossHealth = 0;
                    bossDestroyed = true;
                    updateScore(BOSS_SETTINGS.BONUS_SCORE);
                    
                    // 보스 파괴 시 목숨 1개 추가 (이미 특수 무기로 파괴된 경우는 제외)
                    if (!bullet.isSpecial) {
                        maxLives++; // 최대 목숨 증가
                    }
                    
                    // 큰 폭발 효과
                    explosions.push(new Explosion(
                        enemy.x + enemy.width/2,
                        enemy.y + enemy.height/2,
                        true
                    ));
                    
                    // 추가 폭발 효과
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI * 2 / 8) * i;
                        const distance = 50;
                        explosions.push(new Explosion(
                            enemy.x + enemy.width/2 + Math.cos(angle) * distance,
                            enemy.y + enemy.height/2 + Math.sin(angle) * distance,
                            false
                        ));
                    }
                    
                    // 보스 파괴 시 폭발음 재생
                    if (explosionSound && audioInitialized) {
                        try {
                            explosionSound.currentTime = 0;
                            explosionSound.play().catch(error => {
                                console.log('오디오 재생 실패:', error);
                            });
                        } catch (error) {
                            console.warn('폭발음 재생 중 오류:', error);
                        }
                    }
                    
                    bossActive = false;
                    return false;
                }
                
                // 보스가 파괴되지 않은 상태에서는 점수 부여하지 않음
                isHit = true;
                return false;
            } else {
                // 일반 적 처치
                explosions.push(new Explosion(
                    enemy.x + enemy.width/2,
                    enemy.y + enemy.height/2
                ));
                updateScore(20); //적 처치 시 획득 점수
            }
            
            // 적을 맞췄을 때 효과음 재생
            if (shootSound && audioInitialized) {
                try {
                    shootSound.currentTime = 0;
                    shootSound.play().catch(error => {
                        console.log('오디오 재생 실패:', error);
                    });
                } catch (error) {
                    console.warn('사운드 재생 중 오류:', error);
                }
            }
            
            isHit = true;
            return false;
        }
        return true;
    });

    // 보스의 피격 시간 업데이트
    if (enemy.isBoss && enemy.isBeingHit) {
        const currentTime = Date.now();
        const timeSinceLastHit = currentTime - enemy.lastHitTime;
        
        // 1초 이상 피격이 없으면 피격 상태 해제
        if (timeSinceLastHit > 1000) {
            enemy.isBeingHit = false;
        } else {
            // 피격 시간 누적
            enemy.totalHitTime += timeSinceLastHit;
            enemy.lastHitTime = currentTime;
        }
    }

    // 보스가 파괴된 경우 enemies 배열에서 제거
    if (enemy.isBoss && bossDestroyed) {
        return false;
    }

    if (isHit && !enemy.isBoss) {
        return false;
    }

    // 플레이어와 충돌 체크
    if (checkCollision(player, enemy) || (hasSecondPlane && checkCollision(secondPlane, enemy))) {
        handleCollision();
        explosions.push(new Explosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2));
        return false;
    }

    // 화면 밖으로 나간 적 제거
    return enemy.y < canvas.height + 100 && 
           enemy.y > -100 && 
           enemy.x > -100 && 
           enemy.x < canvas.width + 100;
}

// 총알 발사 처리 함수 수정
function handleBulletFiring() {
    const currentTime = Date.now();
    const currentFireDelay = isContinuousFire ? continuousFireDelay : fireDelay;
    const adjustedFireDelay = currentFireDelay / fireRateMultiplier;
    const currentBulletSize = calculateBulletSize();
    
    // 연속 발사 상태 체크
    if (isSpacePressed && currentTime - spacePressTime > minPressDuration) {
        isContinuousFire = true;
    }
    
    // 발사 조건 체크
    if (isSpacePressed && canFire) {
        // 연속 발사일 때는 딜레이만 체크
        if (isContinuousFire) {
            if (currentTime - lastFireTime < adjustedFireDelay) {
                return;
            }
        } else {
            // 단발 발사일 때는 더 엄격한 조건 체크
            if (currentTime - lastFireTime < singleShotCooldown) {
                return;
            }
            // 스페이스바를 누른 시간이 너무 짧으면 발사하지 않음
            const pressDuration = currentTime - spacePressTime;
            if (pressDuration < 50) {
                return;
            }
        }
        
        lastFireTime = currentTime;
        
        // 총알 발사
        if (hasSpreadShot) {
            // 확산탄 발사
            for (let i = -3; i <= 3; i++) {
                const angle = (i * 12) * (Math.PI / 180);
                const bullet = {
                    x: player.x + player.width/2,
                    y: player.y,
                    width: currentBulletSize,
                    height: currentBulletSize * 2,
                    speed: bulletSpeed,
                    angle: angle,
                    damage: 100 * damageMultiplier
                };
                bullets.push(bullet);
            }
        } else {
            // 일반 총알 발사
            const bullet = {
                x: player.x + player.width/2,
                y: player.y,
                width: currentBulletSize,
                height: currentBulletSize * 2,
                speed: bulletSpeed,
                damage: 100 * damageMultiplier
            };
            bullets.push(bullet);
        }
        
        // 두 번째 비행기 발사
        if (hasSecondPlane) {
            if (hasSpreadShot) {
                for (let i = -3; i <= 3; i++) {
                    const angle = (i * 12) * (Math.PI / 180);
                    const bullet = {
                        x: secondPlane.x + secondPlane.width/2,
                        y: secondPlane.y,
                        width: currentBulletSize,
                        height: currentBulletSize * 2,
                        speed: bulletSpeed,
                        angle: angle,
                        damage: 100 * damageMultiplier
                    };
                    bullets.push(bullet);
                }
            } else {
                const bullet = {
                    x: secondPlane.x + secondPlane.width/2,
                    y: secondPlane.y,
                    width: currentBulletSize,
                    height: currentBulletSize * 2,
                    speed: bulletSpeed,
                    damage: 100 * damageMultiplier
                };
                bullets.push(bullet);
            }
        }
    }
}

// 특수 무기 처리 함수 수정
function handleSpecialWeapon() {
    if (specialWeaponCharged && keys.KeyB) {  // KeyB를 KeyB로 변경
        // 특수 무기 발사 - 더 많은 총알과 강력한 효과
        for (let i = 0; i < 360; i += 5) { // 각도 간격을 10도에서 5도로 감소
            const angle = (i * Math.PI) / 180;
            const bullet = {
                x: player.x + player.width/2,
                y: player.y,
                width: 12,  // 총알 크기 증가
                height: 12, // 총알 크기 증가
                speed: 12,  // 속도 증가
                angle: angle,
                isSpecial: true,
                life: 100,  // 총알 지속 시간 추가
                trail: []   // 꼬리 효과를 위한 배열
            };
            bullets.push(bullet);
        }
        
        // 두 번째 비행기가 있을 경우 추가 발사
        if (hasSecondPlane) {
            for (let i = 0; i < 360; i += 5) {
                const angle = (i * Math.PI) / 180;
                const bullet = {
                    x: secondPlane.x + secondPlane.width/2,
                    y: secondPlane.y,
                    width: 12,
                    height: 12,
                    speed: 12,
                    angle: angle,
                    isSpecial: true,
                    life: 100,
                    trail: []
                };
                bullets.push(bullet);
            }
        }
        
        specialWeaponCharged = false;
        specialWeaponCharge = 0;
        
        // 특수 무기 발사 효과음
        if (shootSound && audioInitialized) {
            try {
                shootSound.currentTime = 0;
                shootSound.play().catch(error => {
                    console.log('오디오 재생 실패:', error);
                });
            } catch (error) {
                console.warn('사운드 재생 중 오류:', error);
            }
        }
        
        // F키 상태 초기화
        keys.KeyB = false;
    }
}

// 폭발 효과 업데이트 및 그리기
function handleExplosions() {
    explosions = explosions.filter(explosion => {
        explosion.draw();
        return explosion.update();
    });
}

// UI 그리기 함수 수정
function drawUI() {
    // 플레이어 비행기 그리기
    drawAirplane(player.x, player.y, player.width, player.height, 'white');
    if (hasSecondPlane) {
        drawAirplane(secondPlane.x, secondPlane.y, secondPlane.width, secondPlane.height, 'white');
    }

    // 점수와 레벨 표시
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`점수: ${score}`, 10, 30);
    ctx.fillText(`레벨: ${gameLevel} (${getDifficultyName(gameLevel)})`, 10, 60);
    ctx.fillText(`다음 레벨까지: ${Math.max(0, levelUpScore - levelScore)}`, 10, 90);
    ctx.fillText(`최고 점수: ${highScore}`, 10, 120);
    ctx.fillText(`다음 확산탄까지: ${2000 - scoreForSpread}점`, 10, 150);
    if (!hasSecondPlane) {
        const nextPlaneScore = Math.ceil(score / 4000) * 4000;
        ctx.fillText(`다음 추가 비행기까지: ${nextPlaneScore - score}점`, 10, 180);
    } else {
        const remainingTime = Math.ceil((10000 - (Date.now() - secondPlaneTimer)) / 1000);
        ctx.fillText(`추가 비행기 남은 시간: ${remainingTime}초`, 10, 180);
    }
    
    // 충돌 횟수 표시 (붉은색으로)
    ctx.fillStyle = 'red';
    ctx.fillText(`남은 목숨: ${maxLives - collisionCount}`, 10, 210);

    // 제작자 정보 표시
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('제작/저작권자:Lee.SS.C', canvas.width - 20, canvas.height - 20);
    
 

    
    // 특수 무기 게이지 표시
    if (!specialWeaponCharged) {
        // 게이지 바 배경
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(10, 250, 200, 20);
        
        // 게이지 바
        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.fillRect(10, 250, (specialWeaponCharge / SPECIAL_WEAPON_MAX_CHARGE) * 200, 20);
        
        // 게이지 바 위에 텍스트 표시
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        const percentText = `특수 무기 : ${Math.floor((specialWeaponCharge / SPECIAL_WEAPON_MAX_CHARGE) * 100)}%`;
        ctx.fillText(percentText, 110, 265);
    } else {
        // 깜빡이는 효과를 위한 시간 계산
        const blinkSpeed = 500; // 깜빡임 속도 (밀리초)
        const currentTime = Date.now();
        const isRed = Math.floor(currentTime / blinkSpeed) % 2 === 0;
        
        // 배경색 설정 (게이지 바)
        ctx.fillStyle = isRed ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 0, 255, 0.3)';
        ctx.fillRect(10, 250, 200, 20);
        
        // 테두리 효과
        ctx.strokeStyle = isRed ? 'red' : 'cyan';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 250, 200, 20);
        
        // 게이지 바 위에 텍스트 표시
        ctx.fillStyle = isRed ? 'red' : 'cyan';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        const percentText = `특수 무기 : ${Math.floor((specialWeaponCharge / SPECIAL_WEAPON_MAX_CHARGE) * 100)}%`;
        ctx.fillText(percentText, 110, 265);
        
        // 준비 완료 메시지 배경
        ctx.fillStyle = isRed ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 0, 255, 0.2)';
        ctx.fillRect(10, 270, 300, 30);
        
        // 텍스트 색상 설정
        ctx.fillStyle = isRed ? 'red' : 'cyan';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('특수무기 사용준비 완료', 15, 290);
    }
    
    // 보스 체력 표시 개선
    if (bossActive) {
        // 체력바 배경
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(canvas.width/2 - 100, 10, 200, 20);
        
        // 체력바
        const healthPercentage = Math.max(0, bossHealth) / BOSS_SETTINGS.HEALTH;
        let healthColor;
        if (healthPercentage > 0.7) healthColor = 'rgba(0, 255, 0, 0.8)';
        else if (healthPercentage > 0.3) healthColor = 'rgba(255, 255, 0, 0.8)';
        else healthColor = 'rgba(255, 0, 0, 0.8)';
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(canvas.width/2 - 100, 10, healthPercentage * 200, 20);
        
        // 체력 수치
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`보스 체력: ${Math.max(0, Math.ceil(bossHealth))}/${BOSS_SETTINGS.HEALTH}`, canvas.width/2, 30);
        
        // 페이즈 표시
        const currentPhase = BOSS_SETTINGS.PHASE_THRESHOLDS.findIndex(
            threshold => bossHealth > threshold.health
        );
        if (currentPhase >= 0) {
            ctx.fillText(`페이즈 ${currentPhase + 1}`, canvas.width/2, 50);
        }
    }
    
    // 파워업 상태 표시
    if (hasSpreadShot) {
        ctx.fillStyle = '#ffff00';
        ctx.fillText('확산탄 활성화', 10, 320);
    }
    if (hasShield) {
        ctx.fillStyle = '#0000ff';
        ctx.fillText('실드 활성화', 10, 350);
    }
    if (damageMultiplier > 1) {
        ctx.fillStyle = '#ff0000';
        ctx.fillText('데미지 2배', 10, 380);
    }
    if (fireRateMultiplier > 1) {
        ctx.fillStyle = '#ff00ff';
        ctx.fillText('연사 속도 증가', 10, 410);
    }
    
    // 총알 크기 정보 표시
    const currentBulletSize = calculateBulletSize();
    if (currentBulletSize > baseBulletSize) {
        ctx.fillStyle = '#ffff00';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`총알 크기 증가: ${currentBulletSize}`, 10, 440);
    }
    
    // 모바일 컨트롤 상태 표시
    showMobileControlStatus();
}

// 게임 시작 이벤트 리스너 수정
window.addEventListener('load', async () => {
    console.log('페이지 로드 완료');
    
    try {
        // 버전 정보 로드 - Electron 환경에서는 package.json 접근이 제한적이므로 기본값 사용
        try {
            // Electron 환경에서는 package.json에 직접 접근할 수 없으므로 기본값 사용
            gameVersion = '1.0.0-202506161826'; // package.json의 현재 버전으로 설정
            console.log('버전 정보 로드 성공:', gameVersion);
        } catch (e) {
            console.warn('버전 정보 로드 실패:', e);
            gameVersion = '1.0.0'; // 기본값 설정
        }

        // canvas와 context 확인
        if (!canvas || !ctx) {
            throw new Error('Canvas 또는 Context를 찾을 수 없습니다.');
        }
        console.log('Canvas 초기화 확인됨');
        
        // 시작 화면 초기화
        initStartScreen();
        gameStarted = false;  // 게임 시작 상태 초기화
        isStartScreen = true;  // 시작 화면 상태 초기화
        
        // IndexedDB 초기화 및 최고 점수 로드
        await initDB();
        highScore = await loadHighScore();
        console.log('초기 최고 점수 로드 완료:', highScore);
        
        // 게임 초기화 실행
        await initializeGame();
    } catch (error) {
        console.error('게임 시작 중 오류:', error);
        // 오류 발생 시 localStorage에서 점수 로드 시도
        try {
            const localScore = parseInt(localStorage.getItem('highScore')) || 0;
            const backupScore = parseInt(localStorage.getItem('highScore_backup')) || 0;
            highScore = Math.max(localScore, backupScore);
            console.log('localStorage에서 로드된 최고 점수:', highScore);
            
            // 게임 초기화 재시도
            await initializeGame();
        } catch (e) {
            console.error('localStorage 로드도 실패:', e);
            highScore = 0;
            await initializeGame();
        }
    }
});

// 난이도 이름 반환 함수
function getDifficultyName(level) {
    const names = ['초급', '중급', '고급', '전문가', '마스터', '그랜드마스터', '레전드', '미스터', '고드'];
    return names[level - 1] || `레벨 ${level}`;
}

// 키 이벤트 리스너 수정
document.addEventListener('keydown', (e) => {

    // 방향키/스페이스 스크롤 방지
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
    }
    if (e.code in keys) {
        keys[e.code] = true;
        
        // 시작 화면이나 게임 오버 상태에서 스페이스바를 누르면 게임 시작/재시작
        if ((isStartScreen || isGameOver) && e.code === 'Space') {
            if (isGameOver) {
                restartGame();
            } else {
                // 오디오 초기화
                initAudio();
                isStartScreen = false;
                gameStarted = true;
                console.log('데스크탑 스페이스바로 게임 시작:', { isStartScreen, gameStarted });
            }
            return;
        }
        
        // 스페이스바를 처음 누를 때
        if (e.code === 'Space' && !isSpacePressed && !isGameOver && gameStarted) {
            const currentTime = Date.now();
            // 마지막 해제 후 일정 시간이 지났을 때만 연속 발사 상태 초기화
            if (currentTime - lastReleaseTime > 500) {
                isContinuousFire = false;
            }
            
            isSpacePressed = true;
            spacePressTime = currentTime;
            lastFireTime = 0;  // 첫 발사를 위해 딜레이 초기화
            canFire = true;  // 발사 가능 상태로 설정
        }
    }
    
    // F5 키를 눌렀을 때 게임 재시작
    if (e.code === 'F5' && isGameOver) {
        e.preventDefault(); // 브라우저 새로고침 방지
        restartGame();
    }
    
    // R 키를 눌렀을 때 최고 점수 리셋
    if (e.code === 'KeyR') {
        if (confirm('최고 점수를 리셋하시겠습니까?')) {
            highScore = 0;
            localStorage.setItem('highScore', '0');
            alert('최고 점수가 리셋되었습니다.');
            console.log('최고 점수 리셋');
        }
    }
    
    // P 키를 눌렀을 때 게임 일시정지/재개
    if (e.code === 'KeyP') {
        isPaused = !isPaused;
    }

    // 시작 화면에서 Enter를 누르면 게임 시작
    if (isStartScreen && e.code === 'Enter') {
        // 오디오 초기화
        initAudio();
        isStartScreen = false;
        gameStarted = true;
        console.log('데스크탑 Enter키로 게임 시작:', { isStartScreen, gameStarted });
        return;
    }
});

document.addEventListener('keyup', (e) => {

    if (e.code in keys) {
        keys[e.code] = false;
        
        // 스페이스바를 뗄 때
        if (e.code === 'Space') {
            isSpacePressed = false;
            lastReleaseTime = Date.now();  // 마지막 해제 시간 기록
            canFire = true;  // 발사 가능 상태로 설정
        }
    }
});

// 게임 오버 시 점수 처리 수정
function handleGameOver() {
    if (!isGameOver) {
        isGameOver = true;
        gameOverStartTime = Date.now();
        
        // 최고 점수 저장
        const finalScore = Math.max(score, highScore);
        if (finalScore > 0) {
            saveHighScoreDirectly(finalScore, 'handleGameOver');
        }
        
        console.log('게임 오버 - 최종 점수:', score, '최고 점수:', highScore);
        
        // 게임 오버 시 사운드 컨트롤 상태 초기화
        isSoundControlActive = false;
        
        // 게임 오버 시 캔버스에 포커스
        document.getElementById('gameCanvas').focus();
    }
}

// 점수 증가 함수 수정
function updateScore(points) {
    score += points;
    scoreForSpread += points;
    levelScore += points;
    
    // 특수 무기 게이지 증가
    if (!specialWeaponCharged) {
        specialWeaponCharge += points;
        if (specialWeaponCharge >= SPECIAL_WEAPON_MAX_CHARGE) {
            specialWeaponCharged = true;
            specialWeaponCharge = SPECIAL_WEAPON_MAX_CHARGE;
        }
    }
    
    // 최고 점수 즉시 업데이트 및 저장
    if (score > highScore) {
        highScore = score;
        saveHighScoreDirectly(highScore, 'updateScore');
    }
}

// 두 번째 비행기 처리 함수 추가
function handleSecondPlane() {
    if (score >= 4000 && score % 4000 === 0 && !hasSecondPlane) {
        hasSecondPlane = true;
        secondPlane.x = player.x - 60;
        secondPlane.y = player.y;
        secondPlaneTimer = Date.now(); // 타이머 시작
        // 두 번째 비행기 획득 메시지
        ctx.fillStyle = 'yellow';
        ctx.font = '40px Arial';
        ctx.fillText('추가 비행기 획득!', canvas.width/2 - 150, canvas.height/2);
    }

    if (hasSecondPlane) {
        const elapsedTime = Date.now() - secondPlaneTimer;
        if (elapsedTime >= 10000) { // 10초 체크
            hasSecondPlane = false;
            // 두 번째 비행기 소멸 메시지
            ctx.fillStyle = 'red';
            ctx.font = '40px Arial';
            ctx.fillText('추가 비행기 소멸!', canvas.width/2 - 150, canvas.height/2);
        }
    }
}

// 확산탄 처리 함수 추가
function handleSpreadShot() {
    if (scoreForSpread >= 2000) {
        // 8발의 확산탄을 원형으로 발사
        for (let i = 0; i < 8; i++) {
            const angle = (i * 45) * (Math.PI / 180);
            const missile = {
                x: player.x + player.width/2,
                y: player.y,
                width: 10,
                height: 25,
                speed: 12,
                angle: angle,
                isSpread: true
            };
            bullets.push(missile);

            // 두 번째 비행기가 있으면 확산탄 발사
            if (hasSecondPlane) {
                const secondMissile = {
                    x: secondPlane.x + secondPlane.width/2,
                    y: secondPlane.y,
                    width: 10,
                    height: 25,
                    speed: 12,
                    angle: angle,
                    isSpread: true
                };
                bullets.push(secondMissile);
            }
        }
        if (shootSound && audioInitialized) {
            try {
                shootSound.currentTime = 0;
                shootSound.play().catch(error => {
                    console.log('오디오 재생 실패:', error);
                });
            } catch (error) {
                console.warn('사운드 재생 중 오류:', error);
            }
        }
        scoreForSpread = 0;
    }
}

// 총알 이동 및 충돌 체크 함수 수정
function handleBullets() {
    bullets = bullets.filter(bullet => {
        if (bullet.isBossBullet) {
            // 보스 총알 이동
            bullet.x += Math.cos(bullet.angle) * bullet.speed;
            bullet.y += Math.sin(bullet.angle) * bullet.speed;
            bullet.rotation += bullet.rotationSpeed;
            
            // 총알 꼬리 효과 추가
            bullet.trail.unshift({x: bullet.x, y: bullet.y});
            if (bullet.trail.length > 5) bullet.trail.pop();
            
            // 총알 그리기
            ctx.save();
            ctx.translate(bullet.x, bullet.y);
            ctx.rotate(bullet.rotation);
            
            // 총알 본체
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, bullet.width/2);
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, bullet.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // 총알 꼬리
            bullet.trail.forEach((pos, index) => {
                const alpha = 1 - (index / bullet.trail.length);
                ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.5})`;
                ctx.beginPath();
                ctx.arc(pos.x - bullet.x, pos.y - bullet.y, 
                        bullet.width/2 * (1 - index/bullet.trail.length), 0, Math.PI * 2);
                ctx.fill();
            });
            
            // 총알 주변에 빛나는 효과
            const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, bullet.width);
            glowGradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
            glowGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(0, 0, bullet.width, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
            
            // 보스 총알과 플레이어 충돌 체크
            if (checkCollision(bullet, player) || 
                (hasSecondPlane && checkCollision(bullet, secondPlane))) {
                handleCollision();
                // 총알 충돌 시 작은 폭발 효과
                explosions.push(new Explosion(bullet.x, bullet.y, false));
                return false;
            }
        } else if (bullet.isSpecial) {
            // 특수 무기 총알 이동 및 효과
            bullet.x += Math.cos(bullet.angle) * bullet.speed;
            bullet.y += Math.sin(bullet.angle) * bullet.speed;
            
            // 꼬리 효과 추가
            bullet.trail.unshift({x: bullet.x, y: bullet.y});
            if (bullet.trail.length > 5) bullet.trail.pop();
            
            // 총알 그리기
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(bullet.x - bullet.width/2, bullet.y - bullet.height/2, bullet.width, bullet.height);
            
            // 꼬리 그리기
            bullet.trail.forEach((pos, index) => {
                const alpha = 1 - (index / bullet.trail.length);
                ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.5})`;
                ctx.fillRect(pos.x - bullet.width/2, pos.y - bullet.height/2, 
                            bullet.width * (1 - index/bullet.trail.length), 
                            bullet.height * (1 - index/bullet.trail.length));
            });
            
            // 총알 주변에 빛나는 효과
            const gradient = ctx.createRadialGradient(
                bullet.x, bullet.y, 0,
                bullet.x, bullet.y, bullet.width
            );
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(bullet.x - bullet.width, bullet.y - bullet.height, 
                        bullet.width * 2, bullet.height * 2);
            
            // 총알 지속 시간 감소
            bullet.life--;
            if (bullet.life <= 0) return false;
        } else if (bullet.isSpread) {
            // 확산탄 이동
            bullet.x += Math.sin(bullet.angle) * bullet.speed;
            bullet.y -= Math.cos(bullet.angle) * bullet.speed;
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(bullet.x - bullet.width/2, bullet.y - bullet.height/2, bullet.width, bullet.height);
        } else {
            // 일반 총알 이동
            bullet.y -= bullet.speed;
            ctx.fillStyle = 'yellow';
            ctx.fillRect(bullet.x - bullet.width/2, bullet.y - bullet.height/2, bullet.width, bullet.height);
        }
        
        // 보스 총알과 플레이어 충돌 체크
        if (bullet.isBossBullet && (checkCollision(bullet, player) || 
            (hasSecondPlane && checkCollision(bullet, secondPlane)))) {
            handleCollision();
            return false;
        }
        
        // 폭탄과 총알 충돌 체크
        bombs = bombs.filter(bomb => {
            if (checkCollision(bullet, bomb)) {
                // 폭탄 폭발
                explosions.push(new Explosion(bomb.x, bomb.y, true));
                // 폭발음 재생
                if (explosionSound && audioInitialized) {
                    try {
                        explosionSound.currentTime = 0;
                        explosionSound.play().catch(error => {
                            console.log('오디오 재생 실패:', error);
                        });
                    } catch (error) {
                        console.warn('폭발음 재생 중 오류:', error);
                    }
                }
                return false;
            }
            return true;
        });

        // 다이나마이트와 총알 충돌 체크
        dynamites = dynamites.filter(dynamite => {
            if (checkCollision(bullet, dynamite)) {
                // 다이나마이트 폭발
                explosions.push(new Explosion(dynamite.x, dynamite.y, true));
                // 폭발음 재생
                if (explosionSound && audioInitialized) {
                    try {
                        explosionSound.currentTime = 0;
                        explosionSound.play().catch(error => {
                            console.log('오디오 재생 실패:', error);
                        });
                    } catch (error) {
                        console.warn('폭발음 재생 중 오류:', error);
                    }
                }
                return false;
            }
            return true;
        });
        
        // 화면 밖으로 나간 총알 제거
        return bullet.y > 0 && bullet.y < canvas.height && 
               bullet.x > 0 && bullet.x < canvas.width;
    });
}

// 보스 관련 상수 추가
const BOSS_SETTINGS = {
    HEALTH: 1000,        // 기본 체력
    DAMAGE: 50,          // 보스 총알 데미지
    SPEED: 2 * mobileSpeedMultiplier,           // 보스 이동 속도
    BULLET_SPEED: 5 * mobileSpeedMultiplier,    // 보스 총알 속도
    PATTERN_INTERVAL: 2000, // 패턴 변경 간격
    SPAWN_INTERVAL: 10000,  // 보스 출현 간격 (10초)
    BONUS_SCORE: 500,    // 보스 처치 보너스 점수를 500으로 설정
    PHASE_THRESHOLDS: [  // 페이즈 전환 체력 임계값
        { health: 750, speed: 2.5 * mobileSpeedMultiplier, bulletSpeed: 6 * mobileSpeedMultiplier },
        { health: 500, speed: 3 * mobileSpeedMultiplier, bulletSpeed: 7 * mobileSpeedMultiplier },
        { health: 250, speed: 3.5 * mobileSpeedMultiplier, bulletSpeed: 8 * mobileSpeedMultiplier }
    ]
};

// 게임 상태 변수에 추가
let lastBossSpawnTime = Date.now();  // 마지막 보스 출현 시간을 현재 시간으로 초기화

// 보스 생성 함수 수정
function createBoss() {
    console.log('보스 생성 함수 호출됨');
    
    // 이미 보스가 존재하는 경우
    if (bossActive) {
        console.log('보스가 이미 존재하여 생성하지 않음');
        return;
    }
    
    const currentTime = Date.now();
    const timeSinceLastBoss = currentTime - lastBossSpawnTime;
    
    // 시간 체크
    if (timeSinceLastBoss < BOSS_SETTINGS.SPAWN_INTERVAL) {
        console.log('보스 생성 시간이 되지 않음:', {
            timeSinceLastBoss,
            requiredInterval: BOSS_SETTINGS.SPAWN_INTERVAL,
            remainingTime: BOSS_SETTINGS.SPAWN_INTERVAL - timeSinceLastBoss
        });
        return;
    }
    
    console.log('보스 생성 시작:', {
        currentTime,
        lastBossSpawnTime,
        timeSinceLastBoss
    });
    
    // 보스 상태 초기화
    bossActive = true;
    bossHealth = BOSS_SETTINGS.HEALTH;
    bossPattern = 0;
    bossTimer = currentTime;
    lastBossSpawnTime = currentTime;
    bossDestroyed = false;  // 보스 파괴 상태 초기화
    
    // 보스 파괴 시 목숨 1개 추가
    maxLives++; // 최대 목숨 증가
    
    // 보스 객체 생성
    const boss = {
        x: Math.random() * (canvas.width - 60),
        y: -60,
        width: 60,
        height: 60,
        speed: BOSS_SETTINGS.SPEED,
        pattern: (gameLevel < 5) ? BOSS_PATTERNS.WAVE_SHOT : BOSS_PATTERNS.CIRCLE_SHOT,
        angle: 0,
        movePhase: 0,
        targetX: canvas.width / 2 - 30,
        targetY: 60,
        phase: 0,
        patternTimer: currentTime,
        bulletSpeed: BOSS_SETTINGS.BULLET_SPEED,
        isBoss: true,
        health: BOSS_SETTINGS.HEALTH,
        randomOffsetX: Math.random() * 120 - 60,
        randomOffsetY: Math.random() * 120 - 60,
        randomAngle: Math.random() * Math.PI * 2,
        randomSpeed: Math.random() * 2 + 1,
        lastUpdateTime: currentTime,
        hitCount: 0,
        totalHitTime: 0,
        lastHitTime: null,
        isBeingHit: false,
        // 패턴 관련 타이머 변수들
        lastPatternChange: currentTime,
        patternDuration: 5000,  // 5초마다 패턴 변경
        lastShot: currentTime,
        patternAngle: 0,
        // 단일 패턴 시스템 변수들
        usedPatterns: [],  // 사용한 패턴들 기록
        currentPatterns: [],  // 현재 사용 중인 패턴들
        // 레벨별 패턴 순서 시스템 (레벨 1~5용)
        patternSequence: [],  // 현재 레벨에서 사용할 패턴 순서
        currentPatternIndex: 0,  // 현재 패턴 인덱스
        isPatternSequenceComplete: false,  // 패턴 순서 완료 여부
        // 단일 패턴 시스템 (레벨 1~5용)
        singlePattern: null  // 현재 사용할 단일 패턴
    };
    
    // 레벨별 패턴 설정
    if (gameLevel <= 5) {
        // 레벨 1~5: 순차적 단일 패턴 시스템
        if (levelBossPatterns.usedPatterns.length < levelBossPatterns.patternSequence.length) {
            // 아직 사용하지 않은 패턴이 있으면 다음 패턴 사용
            boss.singlePattern = levelBossPatterns.patternSequence[levelBossPatterns.usedPatterns.length];
            levelBossPatterns.currentLevelPattern = boss.singlePattern;
        } else {
            // 모든 패턴을 다 사용했으면 랜덤 패턴 사용
            boss.singlePattern = levelBossPatterns.patternSequence[Math.floor(Math.random() * levelBossPatterns.patternSequence.length)];
            levelBossPatterns.currentLevelPattern = boss.singlePattern;
        }
        console.log(`보스 생성 (레벨 ${gameLevel}): ${boss.singlePattern}`);
    } else {
        // 레벨 6 이상: 단일 랜덤 패턴 시스템
        boss.singlePattern = null;
        levelBossPatterns.currentLevelPattern = null;
        console.log(`보스 생성 (레벨 ${gameLevel}): 단일 랜덤 패턴 시스템`);
    }
    
    // 보스 추가
    enemies.push(boss);
    console.log('보스 생성 완료:', boss);
}

// 보스 패턴 처리 함수 수정
function handleBossPattern(boss) {
    const currentTime = Date.now();
    
    // 보스 체력이 0 이하이면 파괴 처리
    if (boss.health <= 0 && !bossDestroyed) {
        bossDestroyed = true;
        bossActive = false;
        bossHealth = 0;
        updateScore(BOSS_SETTINGS.BONUS_SCORE);
        
        // 레벨 1~5에서 패턴 사용 기록
        if (gameLevel <= 5 && boss.singlePattern) {
            if (!levelBossPatterns.usedPatterns.includes(boss.singlePattern)) {
                levelBossPatterns.usedPatterns.push(boss.singlePattern);
                console.log(`패턴 사용 기록: ${boss.singlePattern} (총 ${levelBossPatterns.usedPatterns.length}/${levelBossPatterns.patternSequence.length})`);
            }
        }
        
        // 보스 파괴 시 목숨 1개 추가
        maxLives++; // 최대 목숨 증가
        
        // 큰 폭발 효과
        explosions.push(new Explosion(
            boss.x + boss.width/2,
            boss.y + boss.height/2,
            true
        ));
        // 추가 폭발 효과
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const distance = 50;
            explosions.push(new Explosion(
                boss.x + boss.width/2 + Math.cos(angle) * distance,
                boss.y + boss.height/2 + Math.sin(angle) * distance,
                false
            ));
        }
        // 보스 파괴 시 폭발음 재생
        if (explosionSound && audioInitialized) {
            try {
                explosionSound.currentTime = 0;
                explosionSound.play().catch(error => {
                    console.log('오디오 재생 실패:', error);
                });
            } catch (error) {
                console.warn('폭발음 재생 중 오류:', error);
            }
        }
        
        // 보스 파괴 시 목숨 1개 추가
        maxLives++; // 최대 목숨 증가
        
        return;
    }

    // 보스 이동 패턴
    const movePattern = Math.floor(currentTime / 5000) % 4;  // 5초마다 이동 패턴 변경
    
    switch (movePattern) {
        case 0:  // 좌우 이동
            boss.x += Math.sin(currentTime / 500) * 3;  // 부드러운 좌우 이동
            break;
        case 1:  // 원형 이동
            const radius = 100;
            const centerX = canvas.width / 2;
            const centerY = 100;
            boss.x = centerX + Math.cos(currentTime / 1000) * radius;
            boss.y = centerY + Math.sin(currentTime / 1000) * radius;
            break;
        case 2:  // 지그재그 이동
            boss.x += Math.sin(currentTime / 300) * 4;
            boss.y = 60 + Math.abs(Math.sin(currentTime / 500)) * 40;
            break;
        case 3:  // 추적 이동
            const targetX = player.x;
            const dx = targetX - boss.x;
            boss.x += dx * 0.02;  // 부드러운 추적
            break;
    }
    
    // 패턴 단계별 패턴 선택
    let patterns = [];
    
    // 사용 가능한 패턴 목록
    const availablePatterns = [
        BOSS_PATTERNS.BASIC,
        BOSS_PATTERNS.CIRCLE_SHOT,
        BOSS_PATTERNS.CROSS_SHOT,
        BOSS_PATTERNS.SPIRAL_SHOT,
        BOSS_PATTERNS.WAVE_SHOT,
        BOSS_PATTERNS.DIAMOND_SHOT,
        BOSS_PATTERNS.RANDOM_SPREAD,
        BOSS_PATTERNS.DOUBLE_SPIRAL,
        BOSS_PATTERNS.TRIPLE_WAVE,
        BOSS_PATTERNS.TARGETED_SHOT,
        BOSS_PATTERNS.BURST_SHOT
    ];
    
    // 레벨별 패턴 시스템
    if (gameLevel <= 5) {
        // 레벨 1~5: 순차적 패턴 시스템
        if (boss.singlePattern) {
            patterns = [boss.singlePattern];
        } else {
            // 기본 패턴 사용
            patterns = [BOSS_PATTERNS.BASIC];
        }
    } else {
        // 레벨 6 이상: 단일 랜덤 패턴 시스템 (한 번 등장한 패턴은 모든 패턴이 등장한 후에 다시 등장)
        
        // 보스별 사용한 패턴 추적 시스템 초기화
        if (!boss.usedPatterns) {
            boss.usedPatterns = [];
        }
        
        // 패턴 변경 체크 (5초마다)
        if (currentTime - boss.lastPatternChange >= boss.patternDuration) {
            // 사용 가능한 패턴 목록에서 아직 사용하지 않은 패턴들만 선택
            const unusedPatterns = availablePatterns.filter(pattern => !boss.usedPatterns.includes(pattern));
            
            let selectedPattern;
            
            if (unusedPatterns.length > 0) {
                // 아직 사용하지 않은 패턴이 있으면 그 중에서 랜덤 선택
                selectedPattern = unusedPatterns[Math.floor(Math.random() * unusedPatterns.length)];
                boss.usedPatterns.push(selectedPattern);
                console.log(`보스 패턴 변경 (단일 랜덤): ${selectedPattern} (사용된 패턴: ${boss.usedPatterns.length}/${availablePatterns.length})`);
            } else {
                // 모든 패턴을 다 사용했으면 사용 기록 초기화하고 랜덤 선택
                boss.usedPatterns = [];
                selectedPattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
                boss.usedPatterns.push(selectedPattern);
                console.log(`보스 패턴 변경 (단일 랜덤): ${selectedPattern} (모든 패턴 사용 완료, 기록 초기화)`);
            }
            
            boss.currentPatterns = [selectedPattern];
            boss.lastPatternChange = currentTime;
        }
        
        // 현재 패턴 사용
        if (boss.currentPatterns.length > 0) {
            patterns = boss.currentPatterns;
        } else {
            // 초기 패턴 설정
            const initialPattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
            patterns = [initialPattern];
            boss.currentPatterns = [initialPattern];
            boss.usedPatterns = [initialPattern];
            console.log(`보스 초기 패턴 설정: ${initialPattern}`);
        }
    }
    
    // 현재 패턴들로 공격 실행
    patterns.forEach(pattern => {
        executeBossPattern(boss, pattern, currentTime);
    });
    
    // 보스 체력에 따른 패턴 강화
    const healthPercentage = boss.health / BOSS_SETTINGS.HEALTH;
    if (healthPercentage < 0.3) {  // 체력 30% 이하
        boss.bulletSpeed = BOSS_SETTINGS.BULLET_SPEED * 1.5;  // 총알 속도 증가
        boss.lastShot = Math.min(boss.lastShot, currentTime - 500);  // 공격 간격 감소
    } else if (healthPercentage < 0.6) {  // 체력 60% 이하
        boss.bulletSpeed = BOSS_SETTINGS.BULLET_SPEED * 1.2;  // 총알 속도 약간 증가
        boss.lastShot = Math.min(boss.lastShot, currentTime - 200);  // 공격 간격 약간 감소
    }
}

// 개별 패턴 실행 함수
function executeBossPattern(boss, pattern, currentTime) {
    switch (pattern) {
        case BOSS_PATTERNS.BASIC:
            // 기본 패턴: 직선 발사 (느린 속도)
            if (currentTime - boss.lastShot >= 1500) {
                boss.lastShot = currentTime;
                createBossBullet(boss, Math.PI / 2, false);  // 일반 폭탄
            }
            break;
            
        case BOSS_PATTERNS.CIRCLE_SHOT:
            if (currentTime - boss.lastShot >= 500) {  // 0.5초마다 발사
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    createBossBullet(boss, angle);
                }
                boss.lastShot = currentTime;
            }
            break;
            
        case BOSS_PATTERNS.CROSS_SHOT:
            if (currentTime - boss.lastShot >= 800) {  // 0.8초마다 발사
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI / 2) * i;
                    createBossBullet(boss, angle);
                }
                boss.lastShot = currentTime;
            }
            break;
            
        case BOSS_PATTERNS.SPIRAL_SHOT:
            if (currentTime - boss.lastShot >= 200) {  // 0.2초마다 발사
                createBossBullet(boss, boss.patternAngle);
                boss.patternAngle += Math.PI / 8;  // 22.5도씩 회전
                boss.lastShot = currentTime;
                
                // 나선 패턴이 한 바퀴 완료되면 초기화
                if (boss.patternAngle >= Math.PI * 2) {
                    boss.patternAngle = 0;
                }
            }
            break;
            
        case BOSS_PATTERNS.WAVE_SHOT:
            if (currentTime - boss.lastShot >= 300) {  // 0.3초마다 발사
                const waveAngle = Math.sin(boss.patternAngle) * (Math.PI / 4);  // -45도 ~ 45도 사이
                createBossBullet(boss, Math.PI / 2 + waveAngle);  // 아래쪽으로 파도형 발사
                boss.patternAngle += 0.2;
                boss.lastShot = currentTime;
                
                // 파도 패턴이 일정 시간 지나면 초기화
                if (boss.patternAngle >= Math.PI * 2) {
                    boss.patternAngle = 0;
                }
            }
            break;
            
        case BOSS_PATTERNS.DIAMOND_SHOT:
            if (currentTime - boss.lastShot >= 600) {  // 0.6초마다 발사
                const angles = [0, Math.PI/2, Math.PI, Math.PI*3/2];  // 상, 우, 하, 좌
                angles.forEach(angle => {
                    createBossBullet(boss, angle);
                });
                boss.lastShot = currentTime;
            }
            break;
            
        case BOSS_PATTERNS.RANDOM_SPREAD:
            if (currentTime - boss.lastShot >= 400) {  // 0.4초마다 발사
                for (let i = 0; i < 5; i++) {
                    const randomAngle = Math.random() * Math.PI * 2;  // 0~360도 랜덤
                    createBossBullet(boss, randomAngle);
                }
                boss.lastShot = currentTime;
            }
            break;
            
        case BOSS_PATTERNS.DOUBLE_SPIRAL:
            if (currentTime - boss.lastShot >= 150) {  // 0.15초마다 발사
                // 두 개의 나선형 패턴을 동시에 발사
                createBossBullet(boss, boss.patternAngle);
                createBossBullet(boss, boss.patternAngle + Math.PI);  // 반대 방향
                boss.patternAngle += Math.PI / 12;  // 15도씩 회전
                boss.lastShot = currentTime;
                
                // 이중 나선 패턴이 한 바퀴 완료되면 초기화
                if (boss.patternAngle >= Math.PI * 2) {
                    boss.patternAngle = 0;
                }
            }
            break;
            
        case BOSS_PATTERNS.TRIPLE_WAVE:
            if (currentTime - boss.lastShot >= 200) {  // 0.2초마다 발사
                // 세 개의 파도형 패턴을 동시에 발사
                for (let i = 0; i < 3; i++) {
                    const waveAngle = Math.sin(boss.patternAngle + (i * Math.PI * 2 / 3)) * (Math.PI / 3);
                    createBossBullet(boss, Math.PI / 2 + waveAngle);
                }
                boss.patternAngle += 0.3;
                boss.lastShot = currentTime;
                
                // 삼중 파도 패턴이 일정 시간 지나면 초기화
                if (boss.patternAngle >= Math.PI * 2) {
                    boss.patternAngle = 0;
                }
            }
            break;
            
        case BOSS_PATTERNS.TARGETED_SHOT:
            if (currentTime - boss.lastShot >= 400) {  // 0.4초마다 발사
                // 플레이어를 향해 3발 연속 발사
                const angleToPlayer = Math.atan2(player.y - boss.y, player.x - boss.x);
                for (let i = -1; i <= 1; i++) {
                    const spreadAngle = angleToPlayer + (i * Math.PI / 12);  // ±15도 스프레드
                    createBossBullet(boss, spreadAngle);
                }
                boss.lastShot = currentTime;
            }
            break;
            
        case BOSS_PATTERNS.BURST_SHOT:
            if (currentTime - boss.lastShot >= 1000) {  // 1초마다 발사
                // 8방향으로 동시에 발사
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    createBossBullet(boss, angle);
                }
                // 중앙에 추가 발사
                createBossBullet(boss, Math.PI / 2);
                boss.lastShot = currentTime;
            }
            break;
    }
}

// 보스 총알 생성 함수 수정
function createBossBullet(boss, angle) {
    const bullet = {
        x: boss.x + boss.width/2,
        y: boss.y + boss.height/2,
        width: 12,
        height: 12,
        speed: boss.bulletSpeed,
        angle: angle,
        isBossBullet: true,
        damage: BOSS_SETTINGS.DAMAGE,
        trail: [], // 총알 꼬리 효과를 위한 배열
        glow: 1, // 빛나는 효과를 위한 값
        rotation: 0, // 회전 효과를 위한 값
        rotationSpeed: 0.1 // 회전 속도
    };
    bullets.push(bullet);
}

// 레벨업 체크 함수 수정
function checkLevelUp() {
    if (levelScore >= levelUpScore) {
        gameLevel++;
        levelScore = 0;
        levelUpScore = 1000 * gameLevel; // 레벨이 올라갈수록 다음 레벨까지 필요한 점수 증가
        
        // 현재 난이도 설정 가져오기
        const currentDifficulty = difficultySettings[Math.min(gameLevel, 5)] || {
            enemySpeed: 6 + (gameLevel - 5) * 0.5,
            enemySpawnRate: 0.06 + (gameLevel - 5) * 0.01,
            horizontalSpeedRange: 6 + (gameLevel - 5) * 0.5,
            patternChance: 1.0,
            maxEnemies: 20 + (gameLevel - 5) * 2,
            bossHealth: 2000 + (gameLevel - 5) * 500,
            bossSpawnInterval: 10000, // 10초로 고정
            powerUpChance: 0.3,
            bombDropChance: 0.3,
            dynamiteDropChance: 0.25
        };
        
        // 보스 설정 업데이트
        BOSS_SETTINGS.HEALTH = currentDifficulty.bossHealth;
        BOSS_SETTINGS.SPAWN_INTERVAL = currentDifficulty.bossSpawnInterval;
        
        // 레벨업 메시지 표시
        ctx.fillStyle = 'yellow';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Level ${gameLevel}!`, canvas.width/2, canvas.height/2);
        ctx.font = '20px Arial';
        ctx.fillText(`난이도: ${getDifficultyName(gameLevel)}`, canvas.width/2, canvas.height/2 + 40);
        
        // 레벨업 보상
        if (gameLevel > 1) {
            // 레벨업 시 보상 지급
            const rewards = {
                2: { type: 'shield', duration: 15000 }, // 15초 실드
                3: { type: 'doubleDamage', duration: 20000 }, // 20초 데미지 2배
                4: { type: 'rapidFire', duration: 25000 }, // 25초 연사 속도 증가
                5: { type: 'all', duration: 30000 } // 30초 모든 파워업
            };
            
            const reward = rewards[gameLevel] || { type: 'all', duration: 30000 + (gameLevel - 5) * 5000 };
            if (reward) {
                if (reward.type === 'all') {
                    // 모든 파워업 적용
                    hasShield = true;
                    damageMultiplier = 2;
                    fireRateMultiplier = 2;
                    
                    // 파워업 지속 시간 설정
                    setTimeout(() => {
                        hasShield = false;
                        damageMultiplier = 1;
                        fireRateMultiplier = 1;
                    }, reward.duration);
                } else {
                    // 개별 파워업 적용
                    applyPowerUp(reward.type);
                }
                
                // 보상 메시지 표시
                ctx.fillStyle = '#00ff00';
                ctx.fillText(`보상: ${getRewardName(reward.type)}`, canvas.width/2, canvas.height/2 + 70);
            }
        }
    }
}

// 보상 이름 반환 함수 추가
function getRewardName(type) {
    switch(type) {
        case 'shield':
            return '15초 실드';
        case 'doubleDamage':
            return '20초 데미지 2배';
        case 'rapidFire':
            return '25초 연사 속도 증가';
        case 'all':
            return '30초 모든 파워업';
        default:
            return '';
    }
}

// 적 공격 패턴 상수 추가
const ENEMY_PATTERNS = {
    NORMAL: 'normal',
    ZIGZAG: 'zigzag',
    CIRCLE: 'circle',
    DIAGONAL: 'diagonal',
    DIVE: 'dive',
    SPIRAL: 'spiral',
    WAVE: 'wave',
    CROSS: 'cross',
    V_SHAPE: 'v_shape',
    RANDOM: 'random',
    // 새로운 역동적인 패턴들 추가
    BOUNCE: 'bounce',           // 튀어오르는 패턴
    CHASE: 'chase',             // 플레이어 추적 패턴
    FIGURE_EIGHT: 'figure_eight', // 8자 패턴
    PENDULUM: 'pendulum',       // 진자 패턴
    VORTEX: 'vortex',           // 소용돌이 패턴
    TELEPORT: 'teleport',       // 순간이동 패턴
    MIRROR: 'mirror',           // 거울 패턴 (플레이어 반대 방향)
    ACCELERATE: 'accelerate'    // 가속 패턴
};

// 파워업 아이템 타입 상수 추가
const POWERUP_TYPES = {
    SPEED_UP: 'speed_up',
    SPREAD_SHOT: 'spread_shot',
    SHIELD: 'shield',
    DOUBLE_DAMAGE: 'double_damage',
    RAPID_FIRE: 'rapid_fire'
};

// 파워업 아이템 생성 함수
function createPowerUp() {
    const types = Object.values(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    
    const powerUp = {
        x: Math.random() * (canvas.width - 30),
        y: -30,
        width: 30,
        height: 30,
        speed: 3 * mobileSpeedMultiplier,
        type: type,
        active: true,
        duration: 10000, // 10초 지속
        startTime: Date.now()
    };
    
    powerUps.push(powerUp);
}

// 파워업 아이템 처리 함수
function handlePowerUps() {
    powerUps = powerUps.filter(powerUp => {
        // 파워업 아이템 이동
        powerUp.y += powerUp.speed;
        
        // 파워업 아이템 그리기
        ctx.fillStyle = getPowerUpColor(powerUp.type);
        ctx.beginPath();
        ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, 
                powerUp.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // 플레이어와 충돌 체크
        if (checkCollision(player, powerUp) || 
            (hasSecondPlane && checkCollision(secondPlane, powerUp))) {
            applyPowerUp(powerUp.type);
            return false;
        }
        
        // 화면 밖으로 나간 경우 제거
        return powerUp.y < canvas.height;
    });
}

// 파워업 아이템 색상 반환 함수
function getPowerUpColor(type) {
    switch(type) {
        case POWERUP_TYPES.SPEED_UP:
            return '#00ff00'; // 초록색
        case POWERUP_TYPES.SPREAD_SHOT:
            return '#ffff00'; // 노란색
        case POWERUP_TYPES.SHIELD:
            return '#0000ff'; // 파란색
        case POWERUP_TYPES.DOUBLE_DAMAGE:
            return '#ff0000'; // 빨간색
        case POWERUP_TYPES.RAPID_FIRE:
            return '#ff00ff'; // 보라색
        default:
            return '#ffffff'; // 흰색
    }
}

// 파워업 효과 적용 함수 수정
function applyPowerUp(type) {
    switch(type) {
        case POWERUP_TYPES.SPEED_UP:
            player.speed *= 1.5;
            setTimeout(() => player.speed /= 1.5, 10000);
            break;
        case POWERUP_TYPES.SPREAD_SHOT:
            hasSpreadShot = true;
            setTimeout(() => hasSpreadShot = false, 10000);
            break;
        case POWERUP_TYPES.SHIELD:
            hasShield = true;
            setTimeout(() => hasShield = false, 10000);
            break;
        case POWERUP_TYPES.DOUBLE_DAMAGE:
            damageMultiplier = 2;
            setTimeout(() => damageMultiplier = 1, 10000);
            break;
        case POWERUP_TYPES.RAPID_FIRE:
            fireRateMultiplier = 4;  // 연사 속도 증가 효과 더욱 강화
            setTimeout(() => fireRateMultiplier = 1, 10000);
            break;
    }
}

// 게임 상태 변수에 추가
let bombs = [];  // 폭탄 배열
let dynamites = [];  // 다이나마이트 배열
let powerUps = [];
let hasSpreadShot = false;
let hasShield = false;
let damageMultiplier = 1;
let fireRateMultiplier = 1;
let lastFireTime = 0;  // 마지막 발사 시간
let isSpacePressed = false;  // 스페이스바 누름 상태
let spacePressTime = 0;  // 스페이스바를 처음 누른 시간
let fireDelay = 600;  // 기본 발사 딜레이 (끊어서 발사할 때 - 더 느리게)
let continuousFireDelay = 50;  // 연속 발사 딜레이 (빠르게)
let bulletSpeed = 12 * mobileSpeedMultiplier;  // 총알 속도
let baseBulletSize = 4.5;  // 기본 총알 크기 (1.5배 증가)
let isContinuousFire = false;  // 연속 발사 상태
let canFire = true;  // 발사 가능 상태 추가
let lastReleaseTime = 0;  // 마지막 스페이스바 해제 시간
let singleShotCooldown = 500;  // 단발 발사 쿨다운 시간 (더 길게)
let minPressDuration = 200;  // 연속 발사로 전환되는 최소 누름 시간
let minReleaseDuration = 100;  // 단발 발사를 위한 최소 해제 시간

// 총알 크기 계산 함수 수정
function calculateBulletSize() {
    let size = baseBulletSize;
    
    // 현재 게임 점수에 따른 크기 증가
    if (score >= 10000) {
        size = 7.5;  // 1.5배 증가
    } else if (score >= 5000) {
        size = 6.75;  // 1.5배 증가
    }
    
    // 난이도에 따른 크기 증가
    if (gameLevel >= 4) {
        size = Math.max(size, 7.5);  // 1.5배 증가
    } else if (gameLevel >= 3) {
        size = Math.max(size, 6.75);  // 1.5배 증가
    }
    
    return size;
}

// 게임 상태 변수에 추가
let lastEnemySpawnTime = 0;
const MIN_ENEMY_SPAWN_INTERVAL = 500; // 최소 적 생성 간격 (밀리초)

// 게임 상태 변수에 추가
let isStartScreen = true;  // 시작 화면 상태
let gameStarted = false;  // 게임 시작 상태
let startScreenAnimation = 0;  // 시작 화면 애니메이션 변수
let titleY = -100;  // 제목 Y 위치
let subtitleY = canvas.height + 100;  // 부제목 Y 위치
let stars = [];  // 배경 별들

// 시작 화면 초기화 함수
function initStartScreen() {
    // 배경 별들 생성
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 2 + 1,
            brightness: Math.random()
        });
    }
}

// 시작 화면 그리기 함수
function drawStartScreen() {
    // 배경 그라데이션
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000033');
    gradient.addColorStop(1, '#000066');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 별들 그리기
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // 제목 그라데이션
    const titleGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    titleGradient.addColorStop(0, '#ff0000');
    titleGradient.addColorStop(0.5, '#ffff00');
    titleGradient.addColorStop(1, '#ff0000');

    // 제목 그림자
    ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    // 제목
    ctx.font = 'bold 35px Arial';
    ctx.fillStyle = titleGradient;
    ctx.textAlign = 'center';
    ctx.fillText('SPACE SHOOTER', canvas.width/2, titleY);

    // 시작 화면 애니메이션
    if (titleY < canvas.height/2 - 100) {
        titleY += 5;
    }
    if (subtitleY > canvas.height/2 + 50) {
        subtitleY -= 5;
    }

    // 깜빡이는 효과
    const blinkSpeed = 500;
    const currentTime = Date.now();
    const isVisible = Math.floor(currentTime / blinkSpeed) % 2 === 0;
    
    if (isVisible) {
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#ffff00';
        ctx.fillText('시작/재시작 버튼을 눌러 시작', canvas.width/2, subtitleY);
    }

    // 조작법 안내
    ctx.font = '18px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('화면을 터치하고 드래그하여', 50, canvas.height - 150);
    ctx.fillText('플레이어 비행기를 움직이세요.', 50, canvas.height - 120);
    ctx.fillText('총알은 자동으로 발사됩니다.', 50, canvas.height - 90);
}

// 폭탄 생성 함수 추가
function createBomb(enemy) {
    const bomb = {
        x: enemy.x + enemy.width/2,
        y: enemy.y + enemy.height,
        width: 15,
        height: 15,
        speed: 5 * mobileSpeedMultiplier,
        rotation: 0,
        rotationSpeed: 0.1,
        trail: []  // 폭탄 꼬리 효과를 위한 배열
    };
    bombs.push(bomb);
}

// 폭탄 처리 함수 수정
function handleBombs() {
    bombs = bombs.filter(bomb => {
        // 폭탄 이동
        bomb.y += bomb.speed;
        bomb.rotation += bomb.rotationSpeed;
        
        // 폭탄 꼬리 효과 추가
        bomb.trail.unshift({x: bomb.x, y: bomb.y});
        if (bomb.trail.length > 5) bomb.trail.pop();
        
        // 폭탄 그리기
        ctx.save();
        ctx.translate(bomb.x, bomb.y);
        ctx.rotate(bomb.rotation);
        
        // 폭탄 본체
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(0, 0, bomb.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // 폭탄 꼬리
        bomb.trail.forEach((pos, index) => {
            const alpha = 1 - (index / bomb.trail.length);
            ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(pos.x - bomb.x, pos.y - bomb.y, bomb.width/2 * (1 - index/bomb.trail.length), 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
        
        // 플레이어와 충돌 체크
        if (checkCollision(bomb, player) || (hasSecondPlane && checkCollision(bomb, secondPlane))) {
            handleCollision();
            explosions.push(new Explosion(bomb.x, bomb.y, true));
            return false;
        }
        
        // 화면 밖으로 나간 폭탄 제거
        return bomb.y < canvas.height;
    });
}

// 다이나마이트 생성 함수 추가
function createDynamite(enemy) {
    const dynamite = {
        x: enemy.x + enemy.width/2,
        y: enemy.y + enemy.height,
        width: 20,
        height: 30,
        speed: 4 * mobileSpeedMultiplier,
        rotation: 0,
        rotationSpeed: 0.05,
        flameParticles: [],  // 불꽃 파티클 배열
        fuseTimer: 0,  // 도화선 타이머
        fuseLength: 100,  // 도화선 길이
        fuseBurning: true,  // 도화선 연소 상태
        trail: []  // 꼬리 효과를 위한 배열
    };
    
    // 초기 불꽃 파티클 생성
    for (let i = 0; i < 10; i++) {
        dynamite.flameParticles.push({
            x: 0,
            y: -dynamite.height/2,
            speed: Math.random() * 2 + 1,
            angle: Math.random() * Math.PI * 2,
            size: Math.random() * 3 + 1,
            life: 1
        });
    }
    
    dynamites.push(dynamite);
}

// 다이나마이트 처리 함수 수정
function handleDynamites() {
    dynamites = dynamites.filter(dynamite => {
        // 다이나마이트 이동
        dynamite.y += dynamite.speed;
        dynamite.rotation += dynamite.rotationSpeed;
        
        // 도화선 타이머 업데이트
        if (dynamite.fuseBurning) {
            dynamite.fuseTimer += 1;
            if (dynamite.fuseTimer >= dynamite.fuseLength) {
                // 도화선이 다 타면 폭발
                explosions.push(new Explosion(dynamite.x, dynamite.y, true));
                return false;
            }
        }
        
        // 불꽃 파티클 업데이트
        dynamite.flameParticles.forEach(particle => {
            particle.x += Math.cos(particle.angle) * particle.speed;
            particle.y += Math.sin(particle.angle) * particle.speed;
            particle.life -= 0.02;
            particle.size *= 0.98;
        });
        
        // 새로운 불꽃 파티클 추가
        if (Math.random() < 0.3) {
            dynamite.flameParticles.push({
                x: 0,
                y: -dynamite.height/2,
                speed: Math.random() * 2 + 1,
                angle: Math.random() * Math.PI * 2,
                size: Math.random() * 3 + 1,
                life: 1
            });
        }
        
        // 오래된 파티클 제거
        dynamite.flameParticles = dynamite.flameParticles.filter(p => p.life > 0);
        
        // 다이나마이트 그리기
        ctx.save();
        ctx.translate(dynamite.x, dynamite.y);
        ctx.rotate(dynamite.rotation);
        
        // 다이나마이트 본체
        ctx.fillStyle = '#8B4513';  // 갈색
        ctx.fillRect(-dynamite.width/2, -dynamite.height/2, dynamite.width, dynamite.height);
        
        // 다이나마이트 줄무늬
        ctx.fillStyle = '#FF0000';  // 빨간색
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-dynamite.width/2, -dynamite.height/2 + i * 10, dynamite.width, 3);
        }
        
        // 도화선
        const fuseProgress = dynamite.fuseTimer / dynamite.fuseLength;
        ctx.strokeStyle = '#FFA500';  // 주황색
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -dynamite.height/2);
        ctx.lineTo(0, -dynamite.height/2 - 20 * (1 - fuseProgress));
        ctx.stroke();
        
        // 불꽃 파티클 그리기
        dynamite.flameParticles.forEach(particle => {
            ctx.fillStyle = `rgba(255, ${Math.floor(100 + Math.random() * 155)}, 0, ${particle.life})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
        
        // 플레이어와 충돌 체크
        if (checkCollision(dynamite, player) || (hasSecondPlane && checkCollision(dynamite, secondPlane))) {
            handleCollision();
            explosions.push(new Explosion(dynamite.x, dynamite.y, true));
            return false;
        }
        
        // 화면 밖으로 나간 다이나마이트 제거
        return dynamite.y < canvas.height;
    });
}

// 게임 상태 변수에 추가
let maxLives = 5;  // 최대 목숨 수

// === 사운드 관련 변수 및 함수 ===
let lastExplosionTime = 0;
const EXPLOSION_COOLDOWN = 100; // 효과음 재생 간격 (밀리초)

function playExplosionSound(isSnakePattern = false) {
    const currentTime = Date.now();
    
    if (currentTime - lastExplosionTime < EXPLOSION_COOLDOWN) {
        return; // 쿨다운 중이면 재생하지 않음
    }
    
    explosionSound.currentTime = 0;
    explosionSound.play().catch(error => {
        console.log('오디오 재생 실패:', error);
    });
    lastExplosionTime = currentTime;
}

// 게임 상태 변수 추가
let isGameActive = true;
let isSoundControlActive = false;

// 키보드 입력 처리 함수
function handleGameInput(e) {
    // 게임 오버 상태에서 스페이스바로 재시작 (버튼으로만 재시작하도록 제거)
    // if (isGameOver && e.code === 'Space') {
    //     e.preventDefault();
    //     restartGame();
    //     return;
    // }

    if (!isGameActive || isSoundControlActive) {
        return;
    }

    // 방향키/스페이스 스크롤 방지
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
    }

    // 게임 키 입력 처리
    if (e.code in keys) {
        keys[e.code] = true;
        
        // 스페이스바를 누를 때
        if (e.code === 'Space') {
            isSpacePressed = true;
            if (!spacePressTime) {
                spacePressTime = Date.now();
            }
        }
    }
}

// 키보드 해제 처리 함수
function handleGameInputRelease(e) {
    if (!isGameActive || isSoundControlActive) {
        return;
    }

    if (e.code in keys) {
        keys[e.code] = false;
        
        // 스페이스바를 뗄 때
        if (e.code === 'Space') {
            isSpacePressed = false;
            isContinuousFire = false;
            spacePressTime = 0;
            lastReleaseTime = Date.now();
        }
    }
}

// 사운드 컨트롤 활성화/비활성화 함수
function setSoundControlActive(active) {
    isSoundControlActive = active;
    if (!active) {
        // 사운드 컨트롤이 비활성화되면 게임 캔버스에 포커스
        document.getElementById('gameCanvas').focus();
    }
}

// 이벤트 리스너 등록
document.addEventListener('keydown', handleGameInput);
document.addEventListener('keyup', handleGameInputRelease);

// 게임 초기화 함수 수정
async function initializeGame() {
    console.log('게임 초기화 시작');
    isGameActive = true;
    isSoundControlActive = false;
    
    try {
        // 종료 이벤트 핸들러 설정
        setupExitHandlers();
        
            // 모바일 컨트롤 설정
    setupMobileControls();
    
    // 모바일에서 터치 드래그 컨트롤 설정
    if (isMobile) {
        setupTouchDragControls();
    }
    
    // 모바일 전체화면 모드 활성화
    enableFullscreen();
        
        // 오디오 초기화 (사용자 상호작용 후)
        initAudio();
        
        // 모바일에서는 터치 이벤트로 게임 시작
        if (isMobile) {
            console.log('모바일 환경 감지, 터치 이벤트 대기');
            console.log('모바일 감지 세부사항:', {
                userAgent: navigator.userAgent,
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                ontouchstart: 'ontouchstart' in window,
                maxTouchPoints: navigator.maxTouchPoints
            });
        }
        
        // 최고 점수 로드
        highScore = await loadHighScore();
        console.log('초기화된 최고 점수:', highScore);
        
        // 시작 화면 초기화
        initStartScreen();
        gameStarted = false;  // 게임 시작 상태 초기화
        isStartScreen = true;  // 시작 화면 상태 초기화
        
        // === 모든 게임 요소 완전 초기화 ===
        
        // 1. 충돌 및 게임 상태 초기화
        collisionCount = 0;
        maxLives = 5;  // 최대 목숨 초기화
        hasSecondPlane = false;
        secondPlaneTimer = 0;
        
        // 2. 모든 배열 완전 초기화
        score = 0;
        levelScore = 0;
        scoreForSpread = 0;
        bullets = [];           // 총알 배열 초기화
        enemies = [];           // 적 비행기 배열 초기화
        explosions = [];        // 폭발 효과 배열 초기화
        bombs = [];             // 폭탄 배열 초기화
        dynamites = [];         // 다이나마이트 배열 초기화
        powerUps = [];          // 파워업 배열 초기화
        snakeEnemies = [];      // 뱀 패턴 적 배열 초기화
        snakeGroups = [];       // 뱀 패턴 그룹 배열 초기화
        
        // 3. 게임 상태 초기화
        isGameOver = false;
        isPaused = false;
        flashTimer = 0;
        gameOverStartTime = null;
        
        // 4. 뱀 패턴 상태 초기화
        isSnakePatternActive = false;
        snakePatternTimer = 0;
        snakePatternInterval = 0;
        lastSnakeGroupTime = 0;
        
        // 5. 보스 관련 상태 완전 초기화
        bossActive = false;
        bossHealth = 0;
        bossDestroyed = false;
        bossPattern = 0;
        lastBossSpawnTime = Date.now();
        
        // 6. 플레이어 초기 위치 설정
        player.x = canvas.width / 2;
        player.y = canvas.height - 50;
        secondPlane.x = canvas.width / 2 - 60;
        secondPlane.y = canvas.height - 50;
        
        // 7. 게임 타이머 초기화
        lastEnemySpawnTime = 0;
        
        // 8. 파워업 상태 초기화
        hasSpreadShot = false;
        hasShield = false;
        damageMultiplier = 1;
        fireRateMultiplier = 1;
        
        // 9. 발사 관련 상태 초기화
        lastFireTime = 0;
        isSpacePressed = false;
        spacePressTime = 0;
        fireDelay = 600;
        continuousFireDelay = 50;
        bulletSpeed = 12 * mobileSpeedMultiplier;
        baseBulletSize = 4.5;
        isContinuousFire = false;
        canFire = true;
        lastReleaseTime = 0;
        singleShotCooldown = 500;
        minPressDuration = 200;
        minReleaseDuration = 100;
        
        // 10. 특수무기 관련 상태 초기화
        specialWeaponCharged = false;
        specialWeaponCharge = 0;
        
        // 11. 키보드 입력 상태 초기화
        Object.keys(keys).forEach(key => {
            keys[key] = false;
        });
        
        // 12. 사운드 관련 상태 초기화
        lastCollisionTime = 0;
        lastExplosionTime = 0;
        
        // 13. 패턴 추적 시스템 초기화
        levelBossPatterns.usedPatterns = [];
        levelBossPatterns.currentLevelPattern = null;
        
        console.log('게임 상태 초기화 완료');
        console.log('초기화된 상태:', {
            enemies: enemies.length,
            bullets: bullets.length,
            explosions: explosions.length,
            bombs: bombs.length,
            dynamites: dynamites.length,
            powerUps: powerUps.length,
            snakeGroups: snakeGroups.length,
            bossActive: bossActive,
            isSnakePatternActive: isSnakePatternActive
        });
        
        // 게임 루프 시작
        startGameLoop();
        console.log('게임 루프 시작됨');
        
        // 자동 시작 제거 - 사용자가 직접 시작하도록 함

    } catch (error) {
        console.error('게임 초기화 중 오류:', error);
    }
}

// 게임 오버 처리 함수 수정
function handleGameOver() {
    if (!isGameOver) {
        isGameOver = true;
        gameOverStartTime = Date.now();
        
        // 최고 점수 저장
        const finalScore = Math.max(score, highScore);
        if (finalScore > 0) {
            saveHighScoreDirectly(finalScore, 'handleGameOver');
        }
        
        console.log('게임 오버 - 최종 점수:', score, '최고 점수:', highScore);
        
        // 게임 오버 시 사운드 컨트롤 상태 초기화
        isSoundControlActive = false;
        
        // 게임 오버 시 캔버스에 포커스
        document.getElementById('gameCanvas').focus();
    }
}

// 게임 재시작 함수 수정
function restartGame() {
    // 게임 상태 초기화
    isGameActive = true;
    isSoundControlActive = false;
    isGameOver = false;
    
    console.log('게임 재시작 - 재시작 전 최고 점수:', highScore);
    
    // 현재 최고 점수 저장
    const currentHighScore = Math.max(score, highScore);
    if (currentHighScore > 0) {
        saveHighScoreDirectly(currentHighScore, 'restartGame');
    }
    
    // === 모든 게임 요소 완전 초기화 ===
    
    // 1. 충돌 및 게임 상태 초기화
    collisionCount = 0;
    maxLives = 5;  // 최대 목숨 초기화
    hasSecondPlane = false;
    secondPlaneTimer = 0;
    
    // 2. 모든 배열 완전 초기화
    enemies = [];           // 적 비행기 배열 초기화
    bullets = [];           // 총알 배열 초기화
    explosions = [];        // 폭발 효과 배열 초기화
    bombs = [];             // 폭탄 배열 초기화
    dynamites = [];         // 다이나마이트 배열 초기화
    powerUps = [];          // 파워업 배열 초기화
    snakeEnemies = [];      // 뱀 패턴 적 배열 초기화
    snakeGroups = [];       // 뱀 패턴 그룹 배열 초기화
    
    // 3. 플레이어 위치 초기화
    player.x = canvas.width / 2;
    player.y = canvas.height - 50;
    secondPlane.x = canvas.width / 2 - 60;
    secondPlane.y = canvas.height - 50;
    
    // 4. 게임 타이머 및 상태 초기화
    gameOverStartTime = null;
    flashTimer = 0;
    lastEnemySpawnTime = 0;
    lastBossSpawnTime = Date.now();
    
    // 5. 점수 및 레벨 초기화
    score = 0;
    levelScore = 0;
    scoreForSpread = 0;
    gameLevel = 1;
    levelUpScore = 1000;
    
    // 6. 특수무기 관련 상태 초기화
    specialWeaponCharged = false;
    specialWeaponCharge = 0;
    
    // 7. 보스 관련 상태 완전 초기화
    bossActive = false;
    bossHealth = 0;
    bossDestroyed = false;
    bossPattern = 0;
    
    // 8. 뱀 패턴 상태 초기화
    isSnakePatternActive = false;
    snakePatternTimer = 0;
    snakePatternInterval = 0;
    lastSnakeGroupTime = 0;
    
    // 9. 파워업 상태 초기화
    hasSpreadShot = false;
    hasShield = false;
    damageMultiplier = 1;
    fireRateMultiplier = 1;
    
    // 10. 발사 관련 상태 초기화
    lastFireTime = 0;
    isSpacePressed = false;
    spacePressTime = 0;
    fireDelay = 600;
    continuousFireDelay = 50;
    bulletSpeed = 12 * mobileSpeedMultiplier;
    baseBulletSize = 4.5;
    isContinuousFire = false;
    canFire = true;
    lastReleaseTime = 0;
    singleShotCooldown = 500;
    minPressDuration = 200;
    minReleaseDuration = 100;
    
    // 11. 키보드 입력 상태 초기화
    Object.keys(keys).forEach(key => {
        keys[key] = false;
    });
    
    // 12. 게임 화면 상태 초기화
    isStartScreen = false;
    isPaused = false;
    
    // 13. 사운드 관련 상태 초기화
    lastCollisionTime = 0;
    lastExplosionTime = 0;
    
    // 14. 패턴 추적 시스템 초기화
    levelBossPatterns.usedPatterns = [];
    levelBossPatterns.currentLevelPattern = null;
    
    // 15. 캔버스 포커스 설정
    setTimeout(() => {
        document.getElementById('gameCanvas').focus();
    }, 100);
    
    // 16. 게임 시작 상태 설정
    gameStarted = true;
    
    console.log('게임 재시작 완료 - 모든 요소 초기화됨');
    console.log('현재 최고 점수:', highScore);
    console.log('초기화된 상태:', {
        enemies: enemies.length,
        bullets: bullets.length,
        explosions: explosions.length,
        bombs: bombs.length,
        dynamites: dynamites.length,
        powerUps: powerUps.length,
        snakeGroups: snakeGroups.length,
        bossActive: bossActive,
        isSnakePatternActive: isSnakePatternActive
    });
}

// 터치 드래그 컨트롤 설정
function setupTouchDragControls() {
    console.log('터치 드래그 컨트롤 설정');
    
    // 터치 시작
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        
        // 캔버스 좌표계로 변환 (CSS 크기와 실제 캔버스 크기의 비율 고려)
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        touchStartX = (touch.clientX - rect.left) * scaleX;
        touchStartY = (touch.clientY - rect.top) * scaleY;
        playerStartX = player.x;
        playerStartY = player.y;
        isDragging = true;
        
        // 드래그 시작 시 자동 연속발사 시작
        if (!isGameOver && !isStartScreen) {
            keys.Space = true;
            isSpacePressed = true;
            spacePressTime = Date.now();
            isContinuousFire = true;
            console.log('드래그 연속발사 시작');
        }
        
        // 게임이 시작되지 않았다면 시작
        if (isStartScreen) {
            // 오디오 초기화
            initAudio();
            isStartScreen = false;
            gameStarted = true;
            console.log('터치 드래그로 게임 시작:', { isStartScreen, gameStarted });
        }
        
        console.log('터치 드래그 시작');
    }, { passive: false });
    
    // 터치 이동
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDragging) return;
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        
        // 캔버스 좌표계로 변환 (CSS 크기와 실제 캔버스 크기의 비율 고려)
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const touchX = (touch.clientX - rect.left) * scaleX;
        const touchY = (touch.clientY - rect.top) * scaleY;
        
        // 플레이어 위치 계산 - 터치점이 플레이어 꼬리에서 10픽셀 아래에 오도록 조정
        const tailLength = player.height / 2;
        const newX = Math.max(0, Math.min(canvas.width - player.width, touchX - player.width / 2));
        const newY = Math.max(0, Math.min(canvas.height - player.height, touchY - player.height - tailLength));
        
        // 플레이어 위치 업데이트
        player.x = newX;
        player.y = newY;
        
        // 두 번째 비행기도 함께 이동
        if (hasSecondPlane) {
            secondPlane.x = newX - 60;
            secondPlane.y = newY;
        }
        
    }, { passive: false });
    
    // 터치 종료
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        isDragging = false;
        
        // 드래그 종료 시 연속발사 중지
        if (!isGameOver && !isStartScreen) {
            keys.Space = false;
            isSpacePressed = false;
            lastReleaseTime = Date.now();
            isContinuousFire = false;
            console.log('드래그 연속발사 중지');
        }
        
        console.log('터치 드래그 종료');
    }, { passive: false });
}

// 게임 루프 시작 함수
function startGameLoop() {
    if (!gameLoopRunning) {
        gameLoopRunning = true;
        console.log('게임 루프 시작');
        gameLoop();
    } else {
        console.log('게임 루프가 이미 실행 중입니다');
    }
}

// 사운드 컨트롤 이벤트 핸들러 추가
window.addEventListener('message', (e) => {
    if (e.data === 'soundControlStart') {
        setSoundControlActive(true);
    } else if (e.data === 'soundControlEnd') {
        setSoundControlActive(false);
    }
});

// 랜덤 보스 패턴 선택 함수 수정
function getRandomBossPattern() {
    let patterns = Object.values(BOSS_PATTERNS);
    // 레벨 5 미만에서는 CIRCLE_SHOT 제외
    if (gameLevel < 5) {
        patterns = patterns.filter(p => p !== BOSS_PATTERNS.CIRCLE_SHOT);
    }
    return patterns[Math.floor(Math.random() * patterns.length)];
}

// 레벨별 패턴 추적 시스템 추가
let levelBossPatterns = {
    usedPatterns: [], // 사용한 패턴들 기록
    currentLevelPattern: null, // 현재 레벨에서 사용할 패턴
    patternSequence: [
        BOSS_PATTERNS.CIRCLE_SHOT,
        BOSS_PATTERNS.CROSS_SHOT,
        BOSS_PATTERNS.SPIRAL_SHOT,
        BOSS_PATTERNS.WAVE_SHOT,
        BOSS_PATTERNS.DIAMOND_SHOT,
        BOSS_PATTERNS.RANDOM_SPREAD,
        BOSS_PATTERNS.DOUBLE_SPIRAL,
        BOSS_PATTERNS.TRIPLE_WAVE,
        BOSS_PATTERNS.TARGETED_SHOT,
        BOSS_PATTERNS.BURST_SHOT
    ]
};

// game.js 파일 맨 위에 추가 (임시)
console.log('게임 파일 로드됨 - 버전:', Date.now());