import { useState, useEffect } from 'react';␊
import clsx from 'clsx';␊
import { initializeApp } from 'firebase/app';␊
import {␊
  getAuth,␊
  createUserWithEmailAndPassword,␊
  signInWithEmailAndPassword,␊
  signOut,␊
  onAuthStateChanged␊
} from 'firebase/auth';␊
import {␊
  getFirestore,␊
  setDoc,␊
  getDoc,␊
  getDocs,␊
  doc,␊
  collection␊
} from 'firebase/firestore';␊
␊
// Firebase 설정␊
const firebaseConfig = {␊
  apiKey: "AIzaSyD1MzFkoOcvBHiKhm9ii-XbTtJns6VlLno",␊
  authDomain: "duncantoystore-f5a3d.firebaseapp.com",␊
  projectId: "duncantoystore-f5a3d",␊
  storageBucket: "duncantoystore-f5a3d.firebasestorage.app",␊
  messagingSenderId: "712063855287",␊
  appId: "1:712063855287:web:26f425cf54e50418b93b32"␊
};␊
␊
const app = initializeApp(firebaseConfig);␊
const auth = getAuth(app);␊
const db = getFirestore(app);␊
␊
function getDateLabel(offset = 1) {␊
  const d = new Date();␊
  d.setDate(d.getDate() + offset);␊
  return `${d.getMonth() + 1}.${d.getDate()} (${['일','월','화','수','목','금','토'][d.getDay()]})`;␊
}␊
␊
// Firestore 키에 안전하게 사용할 날짜 포맷␊
function getDateKey(offset = 1) {␊
  const d = new Date();␊
  d.setDate(d.getDate() + offset);␊
  const m = `${d.getMonth() + 1}`.padStart(2, '0');␊
  const day = `${d.getDate()}`.padStart(2, '0');␊
  return `${d.getFullYear()}-${m}-${day}`;␊
}␊
␊
function ScheduleTable({␊
  title,␊
  selected,␊
  toggleSlot,␊
  displayDate,␊
  dateKey = displayDate,␊
  times,␊
  stages,␊
  allSchedules,␊
  readonly = false,␊
  canEdit = true,␊
}) {␊
  return (␊
    <div className="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-md w-full max-w-full overflow-x-auto mt-6">␊
      <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2 border-gray-300">{title} - {displayDate}</h2>␊
      <table className="min-w-full w-full border text-sm text-center bg-gray-100">␊
        <thead>␊
          <tr>␊
            <th className="border p-2 bg-gray-200 text-gray-900">시간/스테이지</th>␊
            {stages.map((stage) => (␊
              <th key={stage} className="border p-2 bg-gray-200 text-gray-900">{stage}</th>␊
            ))}␊
          </tr>␊
        </thead>␊
        <tbody>␊
          {times.map((time) => (␊
            <tr key={time}>␊
              <td className="border p-2 font-medium bg-gray-100 text-gray-800">{time}</td>␊
              {stages.map((stage) => {␊
                const key = `${dateKey}-${time}-${stage}`;␊
                const isSelected = selected[key];␊
                const users = allSchedules[key] || [];␊
                return (␊
                  <td␊
                    key={key}␊
                    className={clsx(␊
                      'border p-2 text-center align-top h-20 overflow-y-auto transition duration-200',␊
                      isSelected ? 'bg-rose-700 text-white' : 'hover:bg-gray-100 text-gray-900',␊
                      readonly ? 'cursor-default' : 'cursor-pointer'␊
                    )}␊
                    onClick={() => {␊
                      if (!readonly && canEdit) {␊
                        toggleSlot(time, stage);␊
                      } else if (!readonly && !canEdit) {␊
                        alert('선택은 오늘까지 가능합니다.');␊
                      }␊
                    }}␊
                  >␊
                    {readonly ? (␊
                      <div className="text-xs text-gray-700 text-left space-y-1">␊
                        {users.map((u, idx) => (␊
                          <div key={idx}>{u}</div>␊
                        ))}␊
                      </div>␊
                    ) : (␊
                      isSelected ? '✔' : ''␊
                    )}␊
                  </td>␊
                );␊
              })}␊
            </tr>␊
          ))}␊
        </tbody>␊
      </table>␊
    </div>␊
  );␊
}␊
␊
export default function ScheduleApp() {␊
  const [userId, setUserId] = useState('');␊
  const [password, setPassword] = useState('');␊
  const [currentUser, setCurrentUser] = useState(null);␊
  const [selected, setSelected] = useState({});␊
  const [original, setOriginal] = useState({});␊
  const [allSchedules, setAllSchedules] = useState({});␊
  const [dateOffset, setDateOffset] = useState(1);␊
  const [page, setPage] = useState('abyss');␊
␊
  const times = ['오전', '오후', '저녁'];␊
  const abyssStages = ['입문~매어', '지옥1', '지옥2', '지옥3'];␊
  const raidStages = ['글기(일반)', '글기(어려움)', '화이트서큐'];␊
  const dateLabel = getDateLabel(dateOffset);␊
  const dateKey = getDateKey(dateOffset);␊
␊
  const now = new Date();␊
  const targetDate = new Date();␊
  targetDate.setDate(targetDate.getDate() + dateOffset);␊
  targetDate.setHours(23, 59, 59, 999);␊
  const canEdit = now <= targetDate;␊
␊
  useEffect(() => {␊
    const unsubscribe = onAuthStateChanged(auth, async (user) => {␊
      if (user) {␊
        setCurrentUser(user);␊
        const saved = await getDoc(doc(db, 'schedules', user.uid));␊
        const savedData = saved.exists() ? saved.data().data : {};␊
        setOriginal(savedData);␊
      } else {␊
        setCurrentUser(null);␊
        setSelected({});␊
      }␊
    });␊
    loadAllSchedules();␊
    return () => unsubscribe();␊
  }, [dateOffset]);␊
␊
  const toggleSlot = (time, stage) => {
    const key = `${getDateKey(dateOffset)}-${time}-${stage}`;
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };
␊
  const handleSignup = async () => {␊
    try {␊
      await createUserWithEmailAndPassword(auth, `${userId}@duncans.com`, password);␊
      alert('회원가입 완료');␊
    } catch (error) {␊
      alert('회원가입 오류: ' + error.message);␊
    }␊
  };␊
␊
  const handleLogin = async () => {␊
    try {␊
      await signInWithEmailAndPassword(auth, `${userId}@duncans.com`, password);␊
    } catch (error) {␊
      alert('로그인 실패: ' + error.message);␊
    }␊
  };␊
␊
  const handleLogout = () => {␊
    signOut(auth);␊
  };␊
␊
  const handleSubmit = async () => {␊
    if (!currentUser) return;␊
    try {␊
    }␊
  };␊
␊
  const restoreOriginal = () => {␊
    setSelected(original);␊
  };␊
␊
  const loadAllSchedules = async () => {␊
    const querySnapshot = await getDocs(collection(db, 'schedules'));␊
    const merged = {};␊
    querySnapshot.forEach((docSnap) => {␊
      const name = docSnap.data().id || docSnap.id.split('@')[0];␊
      const userData = docSnap.data().data || {};␊
      Object.keys(userData).forEach((key) => {␊
        if (userData[key]) {␊
          merged[key] = merged[key] || [];␊
          if (!merged[key].includes(name)) {␊
            merged[key].push(name);␊
          }␊
        }␊
      });␊
    });␊
    setAllSchedules(merged);␊
  };␊
␊
  return (␊
    <div␊
      className="min-h-screen py-8 px-4 text-gray-900"␊
      style={␊
        !currentUser␊
          ? {␊
              backgroundImage: "url('/duncans-toyshop-bg.jpg')",␊
              backgroundSize: 'cover',␊
              backgroundPosition: 'center',␊
            }␊
          : { backgroundColor: '#e5e7eb' }␊
      }␊
    >␊
      <div␊
        className={clsx(␊
          'max-w-5xl mx-auto rounded-3xl p-6 shadow-xl backdrop-blur-md',␊
          currentUser ? 'bg-white/80' : 'bg-white/60'␊
        )}␊
      >␊
        <h1 className="text-3xl font-bold text-center mb-4">던컨의 장난감가게</h1>␊
␊
        {!currentUser ? (␊
          <div className="max-w-sm mx-auto mb-6">␊
            <input␊
              type="text"␊
              placeholder="ID"␊
              className="w-full border rounded-lg px-3 py-2 mb-2 bg-white/70 text-gray-900 placeholder-gray-500 shadow-inner focus:outline-none"␊
              value={userId}␊
              onChange={(e) => setUserId(e.target.value)}␊
            />␊
            <input␊
              type="password"␊
              placeholder="Password"␊
              className="w-full border rounded-lg px-3 py-2 mb-2 bg-white/70 text-gray-900 placeholder-gray-500 shadow-inner focus:outline-none"␊
              value={password}␊
              onChange={(e) => setPassword(e.target.value)}␊
            />␊
            <div className="flex gap-2">␊
              <button␊
                onClick={handleSignup}␊
                className="w-1/2 py-2 rounded-lg bg-pink-500 text-white font-semibold shadow"␊
              >␊
                회원가입␊
              </button>␊
              <button␊
                onClick={handleLogin}␊
                className="w-1/2 py-2 rounded-lg bg-blue-500 text-white font-semibold shadow"␊
              >␊
                로그인␊
              </button>␊
            </div>␊
          </div>␊
        ) : (␊
          <>␊
            <div className="flex justify-between items-center mb-4">␊
              <div className="text-sm">👤 {currentUser.email}</div>␊
              <button␊
                onClick={handleLogout}␊
                className="text-sm text-blue-600 hover:underline"␊
              >␊
                로그아웃␊
              </button>␊
            </div>␊
␊
            <div className="flex justify-center gap-4 mb-4">␊
              <button␊
                onClick={() => setPage('abyss')}␊
                className={clsx(␊
                  'w-24 h-10 rounded-full font-semibold',␊
                  page === 'abyss' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-900'␊
                )}␊
              >␊
                어비스␊
              </button>␊
              <button␊
                onClick={() => setPage('raid')}␊
                className={clsx(␊
                  'w-24 h-10 rounded-full font-semibold',␊
                  page === 'raid' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-900'␊
                )}␊
              >␊
                레이드␊
              </button>␊
            </div>␊
␊
            <div className="flex justify-center gap-2 mb-4">␊
              <button␊
                onClick={() => setDateOffset(dateOffset - 1)}␊
                className="px-3 py-1 bg-gray-200 text-gray-900 rounded-full"␊
              >␊
                ◀␊
              </button>␊
              <button␊
                onClick={() => setDateOffset(1)}␊
                className="px-4 py-1 bg-gray-200 text-gray-900 rounded-full"␊
              >␊
                Today␊
              </button>␊
              <button␊
                onClick={() => setDateOffset(dateOffset + 1)}␊
                className="px-3 py-1 bg-gray-200 text-gray-900 rounded-full"␊
              >␊
                ▶␊
              </button>␊
            </div>␊
␊
            {page === 'abyss' && (␊
              <ScheduleTable␊
                title="어비스 일정 등록"␊
                selected={selected}␊
                toggleSlot={toggleSlot}␊
                displayDate={dateLabel}␊
                dateKey={dateKey}␊
                times={times}␊
                stages={abyssStages}␊
                allSchedules={{}}␊
                readonly={false}␊
                canEdit={canEdit}␊
              />␊
            )}␊
            {page === 'raid' && (␊
              <ScheduleTable␊
                title="레이드 일정 등록"␊
                selected={selected}␊
                toggleSlot={toggleSlot}␊
                displayDate={dateLabel}␊
                dateKey={dateKey}␊
                times={times}␊
                stages={raidStages}␊
                allSchedules={{}}␊
                readonly={false}␊
                canEdit={canEdit}␊
              />␊
            )}␊
␊
            <div className="mt-4 flex gap-2">␊
              <button␊
                className="w-1/2 py-3 rounded-lg bg-green-500 text-white font-semibold shadow"␊
                onClick={handleSubmit}␊
              >␊
                저장␊
              </button>␊
              <button␊
                className="w-1/2 py-3 rounded-lg bg-yellow-500 text-white font-semibold shadow"␊
                onClick={restoreOriginal}␊
              >␊
                수정␊
              </button>␊
            </div>␊
␊
            {page === 'abyss' && (␊
              <ScheduleTable␊
                title="오늘의 어비스 플레이어"␊
                selected={{}}␊
                toggleSlot={() => {}}␊
                displayDate={dateLabel}␊
                dateKey={dateKey}␊
                times={times}␊
                stages={abyssStages}␊
                allSchedules={allSchedules}␊
                readonly={true}␊
              />␊
            )}␊
            {page === 'raid' && (␊
              <ScheduleTable␊
                title="오늘의 레이드 플레이어"␊
                selected={{}}␊
                toggleSlot={() => {}}␊
                displayDate={dateLabel}␊
                dateKey={dateKey}␊
                times={times}␊
                stages={raidStages}␊
                allSchedules={allSchedules}␊
                readonly={true}␊
              />␊
            )}␊
          </>␊
        )}␊
      </div>␊
    </div>␊
  );␊
}␊
