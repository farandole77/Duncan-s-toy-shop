import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
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

function getDateLabel(offset = 1) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getMonth() + 1}.${d.getDate()} (${['일','월','화','수','목','금','토'][d.getDay()]})`;
}

// Firestore 키에 안전하게 사용할 날짜 포맷
@@ -96,143 +97,185 @@ function ScheduleTable({
                  >
                    {readonly ? (
                      <div className="text-xs text-gray-700 text-left space-y-1">
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
  const [selectedAbyss, setSelectedAbyss] = useState({});
  const [selectedRaid, setSelectedRaid] = useState({});
  const [originalAbyss, setOriginalAbyss] = useState({});
  const [originalRaid, setOriginalRaid] = useState({});
  const [allAbyss, setAllAbyss] = useState({});
  const [allRaid, setAllRaid] = useState({});
  const [userList, setUserList] = useState({});
  const [dateOffset, setDateOffset] = useState(1);
  const [page, setPage] = useState(() => localStorage.getItem('lastPage') || 'abyss');

  const times = ['오전', '오후', '저녁'];
  const abyssStages = ['입문~매어', '지옥1', '지옥2', '지옥3'];
  const raidStages = ['글기(일반)', '글기(어려움)', '화이트서큐'];
  const dateLabel = getDateLabel(dateOffset);
  const dateKey = getDateKey(dateOffset);

  const now = new Date();
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + dateOffset);
  targetDate.setHours(23, 59, 59, 999);
  const canEdit = now <= targetDate;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const saved = await getDoc(doc(db, 'schedules', user.uid));
        const data = saved.exists() ? saved.data() : {};
        setOriginalAbyss(data.abyss || {});
        setOriginalRaid(data.raid || {});
        setSelectedAbyss(data.abyss || {});
        setSelectedRaid(data.raid || {});
        setUserId(data.id || user.email.split('@')[0]);
      } else {
        setCurrentUser(null);
        setSelectedAbyss({});
        setSelectedRaid({});
      }
    });
    loadAllSchedules();
    return () => unsubscribe();
  }, [dateOffset]);

  const toggleSlot = (time, stage) => {
    const key = `${getDateKey(dateOffset)}-${time}-${stage}`;
    if (page === 'abyss') {
      setSelectedAbyss((prev) => ({ ...prev, [key]: !prev[key] }));
    } else {
      setSelectedRaid((prev) => ({ ...prev, [key]: !prev[key] }));
    }
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
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'schedules', currentUser.uid), {
        id: userId,
        abyss: selectedAbyss,
        raid: selectedRaid,
      });
      localStorage.setItem('lastPage', page);
      alert('저장 되었습니다.');
      window.location.reload();
    } catch (error) {
      alert('저장 실패: ' + error.message);
    }
  };

  const restoreOriginal = () => {
    setSelectedAbyss(originalAbyss);
    setSelectedRaid(originalRaid);
  };

  const loadAllSchedules = async () => {
    const querySnapshot = await getDocs(collection(db, 'schedules'));
    const mergedAbyss = {};
    const mergedRaid = {};
    const users = {};
    querySnapshot.forEach((docSnap) => {
      const name = docSnap.data().id || docSnap.id.split('@')[0];
      users[docSnap.id] = name;
      const abyssData = docSnap.data().abyss || {};
      Object.keys(abyssData).forEach((key) => {
        if (abyssData[key]) {
          mergedAbyss[key] = mergedAbyss[key] || [];
          if (!mergedAbyss[key].includes(name)) {
            mergedAbyss[key].push(name);
          }
        }
      });
      const raidData = docSnap.data().raid || {};
      Object.keys(raidData).forEach((key) => {
        if (raidData[key]) {
          mergedRaid[key] = mergedRaid[key] || [];
          if (!mergedRaid[key].includes(name)) {
            mergedRaid[key].push(name);
          }
        }
      });
    });
    setUserList(users);
    setAllAbyss(mergedAbyss);
    setAllRaid(mergedRaid);
  };

  const handleDeleteUser = async (uid) => {
    if (!window.confirm('정말로 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'schedules', uid));
      alert('삭제되었습니다.');
      loadAllSchedules();
    } catch (error) {
      alert('삭제 실패: ' + error.message);
    }
  };

  return (
    <div
      className="min-h-screen py-8 px-4 text-gray-900"
      style={
        !currentUser
          ? {
              backgroundImage: "url('/duncans-toyshop-bg.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : { backgroundColor: '#e5e7eb' }
      }
    >
      <div
        className={clsx(
          'max-w-5xl mx-auto rounded-3xl p-6 shadow-xl backdrop-blur-md',
          currentUser ? 'bg-white/80' : 'bg-white/60'
        )}
      >
        <h1 className="text-3xl font-bold text-center mb-4">던컨의 장난감가게</h1>

        {!currentUser ? (
          <div className="max-w-sm mx-auto mb-6">
@@ -300,98 +343,117 @@ export default function ScheduleApp() {

            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => setDateOffset(dateOffset - 1)}
                className="px-3 py-1 bg-gray-200 text-gray-900 rounded-full"
              >
                ◀
              </button>
              <button
                onClick={() => setDateOffset(1)}
                className="px-4 py-1 bg-gray-200 text-gray-900 rounded-full"
              >
                Today
              </button>
              <button
                onClick={() => setDateOffset(dateOffset + 1)}
                className="px-3 py-1 bg-gray-200 text-gray-900 rounded-full"
              >
                ▶
              </button>
            </div>

            {page === 'abyss' && (
              <ScheduleTable
                title="어비스 일정 등록"
                selected={selectedAbyss}
                toggleSlot={toggleSlot}
                displayDate={dateLabel}
                dateKey={dateKey}
                times={times}
                stages={abyssStages}
                allSchedules={{}}
                readonly={false}
                canEdit={canEdit}
              />
            )}
            {page === 'raid' && (
              <ScheduleTable
                title="레이드 일정 등록"
                selected={selectedRaid}
                toggleSlot={toggleSlot}
                displayDate={dateLabel}
                dateKey={dateKey}
                times={times}
                stages={raidStages}
                allSchedules={{}}
                readonly={false}
                canEdit={canEdit}
              />
            )}

            <div className="mt-4 flex gap-2">
              <button
                className="w-1/2 py-3 rounded-lg bg-green-500 text-white font-semibold shadow"
                onClick={handleSubmit}
              >
                저장
              </button>
              <button
                className="w-1/2 py-3 rounded-lg bg-yellow-500 text-white font-semibold shadow"
                onClick={restoreOriginal}
              >
                수정
              </button>
            </div>

            {page === 'abyss' && (
              <ScheduleTable
                title="오늘의 어비스 플레이어"
                selected={{}}
                toggleSlot={() => {}}
                displayDate={dateLabel}
                dateKey={dateKey}
                times={times}
                stages={abyssStages}
                allSchedules={allAbyss}
                readonly={true}
              />
            )}
            {page === 'raid' && (
              <ScheduleTable
                title="오늘의 레이드 플레이어"
                selected={{}}
                toggleSlot={() => {}}
                displayDate={dateLabel}
                dateKey={dateKey}
                times={times}
                stages={raidStages}
                allSchedules={allRaid}
                readonly={true}
              />
            )}

            {userId === 'admin' && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-2">관리자 기능</h2>
                <ul className="space-y-2">
                  {Object.entries(userList).map(([uid, name]) => (
                    <li key={uid} className="flex justify-between items-center">
                      <span>{name}</span>
                      <button
                        onClick={() => handleDeleteUser(uid)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        회원 탈퇴
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
