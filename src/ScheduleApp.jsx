  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  setDoc,
  getDoc,
  getDocs,
  doc,
  collection
} from 'firebase/firestore';

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyD1MzFkoOcvBHiKhm9ii-XbTtJns6VlLno",
  authDomain: "duncantoystore-f5a3d.firebaseapp.com",
  projectId: "duncantoystore-f5a3d",
  storageBucket: "duncantoystore-f5a3d.firebasestorage.app",
  messagingSenderId: "712063855287",
  appId: "1:712063855287:web:26f425cf54e50418b93b32"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function getDateLabel(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getMonth() + 1}.${d.getDate()} (${['일','월','화','수','목','금','토'][d.getDay()]})`;
}

// Firestore 키에 안전하게 사용할 날짜 포맷
function getDateKey(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function ScheduleTable({
  title,
  selected,
  toggleSlot,
  displayDate,
  dateKey = displayDate,
  offset = 0,
  times,
  stages,
  allSchedules,
  readonly = false,
  canEdit = true,
}) {
  return (
    <div className="bg-[#5b3a29]/80 backdrop-blur rounded-2xl p-4 shadow-md w-full max-w-full overflow-x-auto mt-6 text-white">
      <h2 className="text-lg font-semibold mb-4 text-white border-b pb-2 border-gray-300/50">{title} - {displayDate}</h2>
      <table className="min-w-full w-full border text-sm text-center bg-[#5b3a29]/30">
        <thead>
          <tr>
            <th className="border p-2 bg-[#5b3a29]/60 text-white">시간/스테이지</th>
            {stages.map((stage) => (
              <th key={stage} className="border p-2 bg-[#5b3a29]/60 text-white">{stage}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {times.map((time) => (
            <tr key={time}>
              <td className="border p-2 font-medium bg-[#5b3a29]/40 text-white">{time}</td>
              {stages.map((stage) => {
                const key = `${dateKey}-${time}-${stage}`;
                const isSelected = selected[key];
                const users = allSchedules[key] || [];
                return (
                  <td
                    key={key}
                    className={clsx(
                      'border p-2 text-center align-top h-20 overflow-y-auto transition duration-200',
                      isSelected ? 'bg-rose-700 text-white' : 'hover:bg-[#5b3a29]/30 text-white',
                      readonly ? 'cursor-default' : 'cursor-pointer'
                    )}
                    onClick={() => {
                      if (!readonly && canEdit) {
                        toggleSlot(time, stage, offset);
                      } else if (!readonly && !canEdit) {
                        alert('선택은 오늘까지 가능합니다.');
                      }
                    }}
                  >
                    {readonly ? (
                      <div className="text-xs text-white text-left space-y-1">
                        {users.map((u, idx) => (
                          <div key={idx}>{u}</div>
                        ))}
                      </div>
                    ) : (
                      isSelected ? '✔' : ''
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ScheduleApp() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [selected, setSelected] = useState({});
  const [allSchedules, setAllSchedules] = useState({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [page, setPage] = useState('abyss');

  const times = ['오전', '오후', '저녁'];
  const abyssStages = ['입문~매어', '지옥1', '지옥2', '지옥3'];
  const raidStages = ['글기(일반)', '글기(어려움)', '화이트서큐'];

  const now = new Date();
  const canEditForOffset = (offset) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + offset);
    targetDate.setHours(23, 59, 59, 999);
    return now <= targetDate;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const saved = await getDoc(doc(db, 'schedules', user.uid));
        const savedData = saved.exists() ? saved.data().data : {};
        setSelected(savedData);
      } else {
        setCurrentUser(null);
        setSelected({});
      }
    });
    loadAllSchedules();
    return () => unsubscribe();
  }, [weekOffset]);

  const toggleSlot = (time, stage, offset = 0) => {
    const key = `${getDateKey(offset)}-${time}-${stage}`;
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, `${userId}@duncans.com`, password);
      alert('회원가입 완료');
    } catch (error) {
      alert('회원가입 오류: ' + error.message);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, `${userId}@duncans.com`, password);
    } catch (error) {
      alert('로그인 실패: ' + error.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleSubmit = async () => {
@@ -190,167 +191,218 @@ export default function ScheduleApp() {
      alert('저장 실패: ' + error.message);
    }
  };


  const loadAllSchedules = async () => {
    const querySnapshot = await getDocs(collection(db, 'schedules'));
    const merged = {};
    querySnapshot.forEach((docSnap) => {
      const name = docSnap.data().id || docSnap.id.split('@')[0];
      const userData = docSnap.data().data || {};
      Object.keys(userData).forEach((key) => {
        if (userData[key]) {
          merged[key] = merged[key] || [];
          if (!merged[key].includes(name)) {
            merged[key].push(name);
          }
        }
      });
    });
    setAllSchedules(merged);
  };

  return (
    <div
      className="min-h-screen flex flex-col py-8 px-4 text-gray-900 relative overflow-hidden bg-yellow-50"
    >

        {!currentUser ? (
          <div className="flex flex-col flex-grow justify-end items-center w-full">
            <div className="w-full max-w-sm mb-4">
              <input
                type="text"
                placeholder="ID"
                className="w-full border rounded-lg px-3 py-2 mb-2 bg-white/10 text-white placeholder-white/70 shadow-inner focus:outline-none"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full border rounded-lg px-3 py-2 mb-2 bg-white/10 text-white placeholder-white/70 shadow-inner focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex justify-center gap-2 w-full max-w-sm mb-2">
              <button onClick={handleSignup} className="w-1/2 py-2 rounded-lg shadow bg-sky-500 text-white">
                회원가입
              </button>
              <button onClick={handleLogin} className="w-1/2 py-2 rounded-lg shadow bg-sky-500 text-white">
                로그인
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm">👤 {currentUser.email}</div>
              <button
                onClick={handleLogout}
                className="text-sm text-blue-600 hover:underline"
              >
                로그아웃
              </button>
            </div>

            <div className="flex justify-center gap-4 mb-4">
              <button
                onClick={() => setPage('abyss')}
                className={clsx(
                  'px-4 py-2 rounded-lg',
                  page === 'abyss'
                    ? 'bg-white text-sky-500 border border-sky-500'
                    : 'bg-sky-500 text-white'
                )}
              >
                어비스
              </button>
              <button
                onClick={() => setPage('raid')}
                className={clsx(
                  'px-4 py-2 rounded-lg',
                  page === 'raid'
                    ? 'bg-white text-sky-500 border border-sky-500'
                    : 'bg-sky-500 text-white'
                )}
              >
                레이드
              </button>
            </div>

            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => setWeekOffset(weekOffset - 7)}
                className="px-4 py-2 rounded-lg bg-sky-500 text-white"
              >
                이전주
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className="px-4 py-2 rounded-lg bg-sky-500 text-white"
              >
                이번주
              </button>
              <button
                onClick={() => setWeekOffset(weekOffset + 7)}
                className="px-4 py-2 rounded-lg bg-sky-500 text-white"
              >
                다음주
              </button>
            </div>

            {page === 'abyss' && (
              <div className="grid gap-4">
                {Array.from({ length: 7 }).map((_, idx) => {
                  const offset = weekOffset + idx;
                  return (
                    <ScheduleTable
                      key={offset}
                      title="어비스 일정 등록"
                      selected={selected}
                      toggleSlot={(t, s) => toggleSlot(t, s, offset)}
                      displayDate={getDateLabel(offset)}
                      dateKey={getDateKey(offset)}
                      offset={offset}
                      times={times}
                      stages={abyssStages}
                      allSchedules={{}}
                      readonly={false}
                      canEdit={canEditForOffset(offset)}
                    />
                  );
                })}
              </div>
            )}
            {page === 'raid' && (
              <div className="grid gap-4">
                {Array.from({ length: 7 }).map((_, idx) => {
                  const offset = weekOffset + idx;
                  return (
                    <ScheduleTable
                      key={offset}
                      title="레이드 일정 등록"
                      selected={selected}
                      toggleSlot={(t, s) => toggleSlot(t, s, offset)}
                      displayDate={getDateLabel(offset)}
                      dateKey={getDateKey(offset)}
                      offset={offset}
                      times={times}
                      stages={raidStages}
                      allSchedules={{}}
                      readonly={false}
                      canEdit={canEditForOffset(offset)}
                    />
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex justify-center">
              <button
                onClick={handleSubmit}
                className="px-6 py-2 rounded-lg bg-sky-500 text-white"
              >
                저장
              </button>
            </div>

            {page === 'abyss' && (
              <div className="grid gap-4 mt-6">
                {Array.from({ length: 7 }).map((_, idx) => {
                  const offset = weekOffset + idx;
                  return (
                    <ScheduleTable
                      key={"view-abyss-" + offset}
                      title="오늘의 어비스 플레이어"
                      selected={{}}
                      toggleSlot={() => {}}
                      displayDate={getDateLabel(offset)}
                      dateKey={getDateKey(offset)}
                      offset={offset}
                      times={times}
                      stages={abyssStages}
                      allSchedules={allSchedules}
                      readonly={true}
                    />
                  );
                })}
              </div>
            )}
            {page === 'raid' && (
              <div className="grid gap-4 mt-6">
                {Array.from({ length: 7 }).map((_, idx) => {
                  const offset = weekOffset + idx;
                  return (
                    <ScheduleTable
                      key={"view-raid-" + offset}
                      title="오늘의 레이드 플레이어"
                      selected={{}}
                      toggleSlot={() => {}}
                      displayDate={getDateLabel(offset)}
                      dateKey={getDateKey(offset)}
                      offset={offset}
                      times={times}
                      stages={raidStages}
                      allSchedules={allSchedules}
                      readonly={true}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
    </div>
  );
}
