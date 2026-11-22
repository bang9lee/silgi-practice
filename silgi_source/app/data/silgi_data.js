/* 실기 메뉴 자료 — 네트워크관리사 2급 실기 · PC정비사 2급 실기
 * 출처: 한국정보통신자격협회(ICQA) 종목 안내(일정·배점·검정료), 합격자 후기·기출 복원 글(유형·명령어).
 * 화면 로직은 app/silgi.js 에 있습니다. 여기에는 글·문제·미션 자료만 둡니다. */
window.SGD = (function () {
  'use strict';

  // ───────── 시험 정보 (ICQA 종목 안내 페이지 기준) ─────────
  const EXAM = {
    date: '2026-12-06', dateLabel: '12월 6일(일)', apply: '11월 3일(화) ~ 11월 6일(금)', result: '12월 15일(화)',
    fee: '78,000원', minutes: 80,
  };

  // ───────── 공부 계획 (두 시험이 같은 날이라 하나로 묶음) ─────────
  const PLAN = [
    { id: 'p01', when: '11/4 ~ 11/6', t: '랜 케이블 실습 시작', d: '공구가 오면 T568B 순서로 다이렉트 3개, 크로스 2개를 만들고 테스터로 확인합니다.' },
    { id: 'p02', when: '11/4 ~ 11/6', t: '라우터 모드와 기본 명령 외우기', d: '이 메뉴의 라우터 연습창에서 미션 1~6번을 성공합니다.' },
    { id: 'p03', when: '11/7 ~ 11/13', t: '윈도우 서버 8유형 1회독', d: 'IP·DNS·DHCP·FTP·웹·계정·보안 정책·서비스. 유형마다 ICQA 실습용 에뮬레이터로 2번씩 직접 설정합니다.' },
    { id: 'p04', when: '11/14 ~ 11/18', t: '라우터 미션 전부 성공', d: '연습창 미션을 모두 성공하고, ICQA Router Emulator로 같은 순서를 다시 칩니다.' },
    { id: 'p05', when: '11/19 ~ 11/23', t: 'PC정비사: CMOS·콘솔·레지스트리', d: 'BIOS 연습 화면 미션, 콘솔 명령어 실전 문제, 레지스트리 루트 키 외우기.' },
    { id: 'p06', when: '11/24 ~ 11/27', t: '리눅스·단답형 + 부품 드래그', d: '네관사 리눅스·단답형, PC정비사 메모리 핀·포트 색·메인보드 부품 짝 맞추기.' },
    { id: 'p07', when: '11/28 ~ 12/3', t: '실전 문제 2회독 · 틀린 것만 다시', d: '두 시험의 실전 문제를 모두 풀고, 틀린 문제만 다시 풉니다. 케이블은 매일 1개를 10분 안에 만듭니다.' },
    { id: 'p08', when: '12/4 ~ 12/5', t: 'ICQA 모의고사 예제 프로그램으로 마무리', d: '실제 시험 화면으로 한 번씩 풀고, 시험 당일 체크리스트를 확인합니다.' },
  ];

  const DAY = [
    { id: 'd01', t: '수험표와 신분증', d: '수험표에 적힌 입실 시간과 시험장 주소를 다시 확인합니다.' },
    { id: 'd02', t: '시험장 위치 확인', d: '시험장은 접수 번호 순서로 배정되어 집에서 멀 수 있습니다. ICQA 마이페이지 → 접수 내역에서 확인합니다.' },
    { id: 'd03', t: '랜툴·니퍼·탈피기 챙기기', d: '합격 후기에서는 본인 공구를 가져가라고 권합니다. 공식 준비물은 수험표 안내를 따르세요.' },
    { id: 'd04', t: '입실 시간 확인', d: '2022년 공지 기준: 네트워크관리사 2급 실기 09:20, PC정비사 2급 실기 11:20 입실(각 80분). 이번 회차 시간은 수험표로 확인합니다.' },
    { id: 'd05', t: '지시문을 그대로 읽기', d: '대소문자, "활성화"(no shutdown), "로그인"(login), "저장"(copy r s 다음 Enter)을 빠뜨리지 않습니다.' },
    { id: 'd06', t: '케이블은 10분 안에 제출', d: '네트워크관리사는 케이블을 먼저 10분 안에 만들어 제출하고, 감독관이 회수합니다.' },
  ];

  // ───────── 공통: 랜 케이블 ─────────
  const CABLE = `
<h2>먼저 알아둘 것</h2>
<ul>
<li>랜선 안에는 선이 <strong>8가닥</strong>(2가닥씩 꼬인 4쌍) 있습니다. 색은 주황·초록·파랑·갈색이고, 각 색마다 <strong>흰 줄무늬 선</strong>이 하나씩 짝입니다.</li>
<li>배열 규칙은 두 가지입니다. <strong>T568B</strong>와 <strong>T568A</strong>. (TIA/EIA-568 표준의 A형, B형)</li>
<li><strong>다이렉트(Direct, 스트레이트)</strong> 케이블 = 양쪽 끝 배열이 같음 (보통 양쪽 다 T568B).</li>
<li><strong>크로스(Cross) 케이블</strong> = 한쪽은 T568B, 다른 쪽은 T568A. 주황 쌍과 초록 쌍의 자리가 바뀝니다.</li>
</ul>
<div data-sg-widget="pins"></div>
<div class="callout tip"><b class="h">외우는 법</b>T568B: <span class="mem">주 · 초 · 파 · 갈</span> 순서인데, <strong>4번 파랑과 6번 초록 자리만 엇갈립니다.</strong> 흰 줄무늬 선은 항상 <strong>홀수 번호(1·3·5·7)</strong>입니다. T568A는 B에서 <strong>주황과 초록만 바꾸면</strong> 됩니다.</div>

<h2>다이렉트? 크로스? 판단법</h2>
<p>장비를 두 그룹으로 나눕니다. <strong>다른 그룹끼리는 다이렉트, 같은 그룹끼리는 크로스</strong>입니다.</p>
<div class="tbl"><table><thead><tr><th>그룹</th><th>장비</th><th>포트 종류</th></tr></thead><tbody>
<tr><td>A 그룹</td><td>PC, 서버, 라우터</td><td>MDI (Medium Dependent Interface)</td></tr>
<tr><td>B 그룹</td><td>스위치, 허브</td><td>MDI-X (MDI crossover, 안에서 이미 교차됨)</td></tr>
</tbody></table></div>
<div class="tbl"><table><thead><tr><th>연결</th><th>케이블</th></tr></thead><tbody>
<tr><td>PC ↔ 스위치(허브)</td><td>다이렉트</td></tr>
<tr><td>라우터 ↔ 스위치</td><td>다이렉트</td></tr>
<tr><td>PC ↔ PC</td><td>크로스</td></tr>
<tr><td>PC ↔ 라우터</td><td>크로스 (둘 다 A 그룹)</td></tr>
<tr><td>스위치 ↔ 스위치</td><td>크로스</td></tr>
</tbody></table></div>
<div class="callout trap"><b class="h">함정</b>허브끼리 연결해도 <strong>업링크(Uplink) 포트</strong>를 쓰면 다른 장비 연결로 보고 다이렉트입니다. 중간에 <strong>커플러(연장 젠더)</strong>가 있어도 케이블 종류에는 영향이 없습니다. 지시문에 "기존 케이블"이 있으면 그 조건에 맞춰 반대쪽을 만듭니다.</div>

<h2>만드는 순서 (그림)</h2>
<div data-sg-widget="steps"></div>

<h2>테스터로 확인하기</h2>
<ul>
<li>본체(MASTER)에 9V 건전지를 넣고, 케이블 한쪽은 MASTER, 다른 쪽은 REMOTE에 꽂은 뒤 전원을 켭니다.</li>
<li><strong>다이렉트</strong>: 양쪽 불이 <strong>1-1, 2-2, 3-3 … 8-8</strong> 같은 번호로 차례대로 켜집니다.</li>
<li><strong>크로스</strong>: MASTER 1번일 때 REMOTE <strong>3번</strong>, 2번일 때 <strong>6번</strong>, 3번일 때 <strong>1번</strong>, 6번일 때 <strong>2번</strong>이 켜집니다. 4·5·7·8번은 같은 번호입니다.</li>
<li>불이 안 켜지는 번호가 있으면 그 선이 끝까지 안 들어갔거나 압착이 덜 된 것입니다. 잘라내고 다시 만듭니다.</li>
</ul>
<div class="callout"><b class="h">채점 기준 (합격자 후기)</b><strong>배열 순서</strong>, 선이 <strong>끝까지 닿았는지</strong>, 커넥터에서 <strong>빠지지 않는지</strong>를 봅니다. 케이블 길이는 크게 상관없다고 합니다. 네트워크관리사는 케이블 문제가 <strong>10분</strong>이고, 제출하면 감독관이 회수합니다.</div>

<h2>색 순서 연습</h2>
<p>아래 버튼을 1번부터 순서대로 누르세요. 손이 기억할 때까지 반복합니다.</p>
<div data-sg-widget="colors"></div>`;

  // 케이블 만드는 순서 (그림은 silgi.js가 그립니다)
  const STEPS = [
    { t: '피복 벗기기', d: '케이블 끝에서 <strong>약 2.5~3cm</strong> 위치에 탈피기를 물리고 한 바퀴 돌려 겉피복을 벗깁니다. 속선 피복에 상처가 나지 않게 살살 돌립니다.' },
    { t: '꼬임 풀고 곧게 펴기', d: '4쌍의 꼬임을 끝까지 풀고, 손가락으로 훑어서 8가닥을 곧게 폅니다.' },
    { t: '순서대로 나란히 세우기', d: '왼쪽부터 <strong>흰주·주·흰초·파·흰파·초·흰갈·갈</strong>(T568B). 엄지와 검지로 납작하게 눌러 순서가 섞이지 않게 잡습니다.' },
    { t: '일자로 자르기', d: '겉피복 끝에서 <strong>약 1.2~1.5cm</strong>만 남기고 랜툴 칼날로 <strong>수평으로</strong> 자릅니다. 너무 길면 겉피복이 커넥터에 물리지 않고, 너무 짧으면 핀에 닿지 않습니다.' },
    { t: '커넥터에 밀어 넣기', d: '커넥터 <strong>클립(걸쇠)을 아래</strong>, 금색 핀을 위로 둡니다. 이때 <strong>왼쪽이 1번</strong>입니다. 8가닥이 커넥터 <strong>맨 끝까지</strong> 닿고, 겉피복도 커넥터 안으로 들어가야 합니다.' },
    { t: '압착하기', d: '랜툴의 8P(RJ45) 홈에 커넥터를 끝까지 넣고 손잡이를 <strong>끝까지 꽉</strong> 누릅니다. 확실하게 하려면 한 번 더 누릅니다.' },
    { t: '테스터로 확인', d: '양쪽 끝을 MASTER·REMOTE에 꽂고 불이 켜지는 순서를 봅니다. 다이렉트는 1-1 … 8-8 순서입니다.' },
  ];

  // ═════════════ 네트워크관리사 2급 실기 ═════════════
  const NET_START = `
<h2>시험 한눈에 보기</h2>
<div class="tbl"><table><tbody>
<tr><td>시험일</td><td>2026년 ${EXAM.dateLabel} · 2026년 제4회</td></tr>
<tr><td>원서 접수</td><td>${EXAM.apply}</td></tr>
<tr><td>합격 발표</td><td>${EXAM.result}</td></tr>
<tr><td>시험 시간</td><td>80분 · 협회 안내: 1 SET(1~20문항), 작업/서술/선택형</td></tr>
<tr><td>합격 기준</td><td>100점 만점에 <strong>60점 이상</strong></td></tr>
<tr><td>검정료</td><td>${EXAM.fee}</td></tr>
<tr><td>응시 자격</td><td>2급 필기 합격일로부터 2년 안</td></tr>
</tbody></table></div>

<h2>문제 구성과 배점</h2>
<div class="tbl"><table><thead><tr><th>유형</th><th>문제</th><th>배점</th><th>시간</th></tr></thead><tbody>
<tr><td>랜 케이블 제작</td><td>1</td><td>6.5점</td><td>10분</td></tr>
<tr><td>윈도우 서버 설정 (에뮬레이터)</td><td>8</td><td>각 5.5점 = <strong>44점</strong></td><td rowspan="2">50분</td></tr>
<tr><td>단답형·선택형 (리눅스 포함)</td><td>6</td><td>각 5.5점 = 33점</td></tr>
<tr><td>라우터 명령어</td><td>3</td><td>각 5.5점 = <strong>16.5점</strong></td><td>20분</td></tr>
</tbody></table></div>
<div class="callout tip"><b class="h">합격 계산</b>윈도우 44점 + 라우터 16.5점 = <strong>60.5점</strong>. 이 두 유형만 다 맞혀도 합격선을 넘습니다. 케이블 6.5점까지 챙기면 여유가 생깁니다. 단답형은 범위가 넓어서 시험 직전에 자주 나온 것 위주로 봅니다.</div>
<p class="muted" style="font-size:13.5px">문제 수·배점·시간은 2025~2026년 합격자 후기 기준입니다. 협회는 "1 SET(1~20문항), 80분, 작업/서술/선택형"까지만 공개합니다.</p>

<h2>공부 순서</h2>
<ol>
<li><strong>윈도우 서버</strong> — 점수가 가장 큼. 유형이 8가지로 거의 정해져 있음.</li>
<li><strong>라우터</strong> — 명령어 패턴이 고정. 외우면 3문제를 확실히 맞힘.</li>
<li><strong>랜 케이블</strong> — 손으로 연습해야 시험장에서 10분 안에 끝냄.</li>
<li><strong>단답형·리눅스</strong> — 필기 때 공부한 내용. 시험 직전에 빈출 위주로 복습.</li>
</ol>

<h2>연습 프로그램 (ICQA 자료실 · 윈도우 PC용)</h2>
<div class="tbl"><table><thead><tr><th>프로그램</th><th>쓰는 곳</th></tr></thead><tbody>
<tr><td>네트워크관리사 실습용 에뮬레이터 (32/64bit)</td><td>윈도우 서버 설정 문제 연습</td></tr>
<tr><td>Router Emulator 프로그램 - 수험생 실습용</td><td>라우터 명령어 문제 연습</td></tr>
<tr><td>ICQA 모의고사 예제 프로그램 (32/64bit)</td><td>실제 시험 화면 체험</td></tr>
</tbody></table></div>
<div class="callout trap"><b class="h">주의</b>이 프로그램들은 <strong>윈도우 PC에서만</strong> 실행됩니다. 폰으로는 이 메뉴의 <strong>라우터 연습창</strong>과 <strong>실전 문제</strong>로 순서를 익히고, PC 앞에서는 ICQA 프로그램으로 직접 설정해 보세요.</div>
<p><a class="btn btn-outline btn-sm" href="https://www.icqa.or.kr/cn/board/dataroom?sca=%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC%EA%B4%80%EB%A6%AC%EC%82%AC" target="_blank" rel="noopener">ICQA 자료실 · 네트워크관리사 ↗</a></p>`;

  const NET_WIN = `
<div class="callout"><b class="h">이 유형의 특징</b>8문제 × 5.5점 = <strong>44점</strong>. 문제의 &lt;보기&gt; 값을 Windows 관리 화면에 그대로 입력하는 방식입니다. 2025년 8월부터 출제기준이 <strong>Windows Server 2022</strong>로 바뀌었습니다. 아래 경로는 실제 Windows Server 기준이며, 에뮬레이터 화면은 조금 다를 수 있으니 ICQA 실습용 에뮬레이터로 꼭 직접 눌러 보세요.</div>

<h2>① 네트워크(IP) 설정</h2>
<div class="callout tip"><b class="h">기출 예시</b>IP 주소 <code>10101100.00010000.10010110.01110011</code>, 서브넷 마스크 <code>22 Bit</code>. 기본 게이트웨이, DNS 서버 입력. 게이트웨이 1개와 보조 DNS를 <strong>추가</strong>.</div>
<ol>
<li><kbd>Win</kbd>+<kbd>R</kbd> → <code>ncpa.cpl</code> (네트워크 연결) 실행</li>
<li><strong>이더넷</strong> 우클릭 → <strong>속성</strong> → <strong>인터넷 프로토콜 버전 4(TCP/IPv4)</strong> → <strong>속성</strong></li>
<li><strong>다음 IP 주소 사용</strong>: IP 주소, 서브넷 마스크, 기본 게이트웨이 입력</li>
<li><strong>다음 DNS 서버 주소 사용</strong>: 기본 설정 DNS 서버, 보조 DNS 서버 입력</li>
<li>게이트웨이나 DNS를 더 넣으라면 <strong>[고급]</strong> → IP 설정 탭의 기본 게이트웨이 <strong>[추가]</strong> / DNS 탭의 <strong>[추가]</strong></li>
</ol>
<p><strong>계산 방법</strong>: 2진수 8자리씩 10진수로 바꿉니다. 22비트 마스크 = 앞에서 1이 22개 = <code>255.255.252.0</code>. 아래 변환기로 연습하세요.</p>
<div data-sg-widget="bin2dec"></div>
<div data-widget="subnet"></div>
<div class="callout trap"><b class="h">함정</b>"사용 가능한 첫 번째 주소"는 네트워크 주소 + 1, "마지막 주소"는 브로드캐스트 주소 − 1입니다. 호스트가 6개 이상 필요하면 2³ − 2 = 6이므로 <code>/29</code>(255.255.255.248)입니다.</div>

<h2>② DNS 서버 설정</h2>
<div class="callout tip"><b class="h">기출 예시</b>SOA 레코드: 일련 번호 10, 새로 고침 15분, 다시 시도 10분, 만료 1일, 최소 TTL 1시간. <code>www</code>는 A 레코드로 192.168.100.20, <code>ftp</code>는 <code>www</code>를 가리키는 CNAME(별칭).</div>
<ol>
<li><strong>서버 관리자</strong> → <strong>도구</strong> → <strong>DNS</strong> → 서버 이름 펼치기</li>
<li>영역이 없으면: <strong>정방향 조회 영역</strong> 우클릭 → <strong>새 영역</strong> → <strong>주 영역</strong> → 영역 이름(예: icqa.or.kr) → 마침</li>
<li>영역 우클릭 → <strong>새 호스트(A 또는 AAAA)</strong> → 이름 <code>www</code>, IP 주소 입력 → 호스트 추가</li>
<li>영역 우클릭 → <strong>새 별칭(CNAME)</strong> → 별칭 이름 <code>ftp</code>, 대상 호스트의 FQDN <code>www.icqa.or.kr</code></li>
<li>영역 우클릭 → <strong>속성</strong> → <strong>SOA(권한 시작)</strong> 탭 → 일련 번호, 주 서버, 책임자, 새로 고침 간격, 다시 시도 간격, 만료, 최소 TTL 입력</li>
</ol>
<div class="callout trap"><b class="h">함정</b>SOA의 <strong>주 서버·책임자</strong>는 앞부분만 쓰지 말고 <strong>전체 이름(FQDN)</strong>을 씁니다. 일련 번호는 문제에 적힌 숫자 그대로 넣습니다. 시간 단위(분·시간·일)를 꼭 맞춥니다.</div>
<p class="muted">레코드 뜻: <strong>A</strong> = 이름 → IPv4 주소 · <strong>AAAA</strong> = 이름 → IPv6 · <strong>CNAME</strong>(Canonical Name) = 별칭 · <strong>MX</strong>(Mail Exchanger) = 메일 서버 · <strong>PTR</strong>(Pointer) = IP → 이름(역방향) · <strong>SOA</strong>(Start of Authority) = 영역의 기본 정보 · <strong>NS</strong>(Name Server) = 이름 서버</p>

<h2>③ DHCP 서버 설정</h2>
<div class="callout tip"><b class="h">기출 예시</b>범위 이름·설명, 192.168.106.1~254 분배, 제외 범위, 임대 기간 8일, 서브넷 마스크 255.255.255.0, 게이트웨이 192.168.106.1, 192.168.106.200을 MAC 주소로 예약, 범위 활성화.</div>
<ol>
<li><strong>서버 관리자</strong> → <strong>도구</strong> → <strong>DHCP</strong> → 서버 → <strong>IPv4</strong> 우클릭 → <strong>새 범위</strong></li>
<li>범위 이름·설명 → <strong>IP 주소 범위</strong>(시작 IP, 끝 IP, 서브넷 마스크)</li>
<li><strong>제외 및 지연 추가</strong>: 제외할 시작·끝 IP → [추가]</li>
<li><strong>임대 기간</strong>: 일·시간·분</li>
<li>DHCP 옵션 구성 → <strong>라우터(기본 게이트웨이)</strong> [추가] → 도메인 이름 및 DNS 서버 → WINS 서버</li>
<li><strong>범위 활성화</strong>: 문제에 활성화 지시가 없으면 <strong>"아니요"</strong></li>
<li>예약: 범위 펼치기 → <strong>예약</strong> 우클릭 → <strong>새 예약</strong> → 예약 이름, IP 주소, MAC 주소 → 추가</li>
<li>활성화하라는 지시가 있으면 마지막에 <strong>범위 우클릭 → 활성화</strong></li>
</ol>
<div class="callout trap"><b class="h">함정</b>지시가 없는 항목은 기본값 그대로 넘깁니다. 예약은 범위를 만든 <strong>다음에</strong> 따로 넣습니다.</div>

<h2>④ FTP 사이트 추가</h2>
<div class="callout tip"><b class="h">기출 예시</b>사이트 이름 ICQA, 실제 경로 C:\\inetpub\\ftproot, IP 192.168.100.10, 포트 2121, 익명 사용자 읽기만 허용, 200.115.100.0/24 접속 거부, 최대 연결 수 메시지 입력.</div>
<ol>
<li><strong>서버 관리자</strong> → <strong>도구</strong> → <strong>IIS(인터넷 정보 서비스) 관리자</strong> → 서버 펼치기 → <strong>사이트</strong> 우클릭 → <strong>FTP 사이트 추가</strong></li>
<li>FTP 사이트 이름, 실제 경로 → <strong>바인딩 및 SSL 설정</strong>: IP 주소, 포트 (SSL 지시가 없으면 "SSL 사용 안 함")</li>
<li><strong>인증 및 권한 부여 정보</strong>: 권한 부여 → 액세스 허용 대상 <strong>익명 사용자</strong>, 사용 권한 <strong>읽기</strong> → 마침</li>
<li>만든 사이트 선택 → <strong>FTP IPv4 주소 및 도메인 제한</strong> → <strong>거부 항목 추가</strong> → IP 주소 범위 200.115.100.0, 마스크 255.255.255.0</li>
<li><strong>FTP 메시지</strong> → 최대 연결 수 메시지 / 시작 메시지 칸에 입력 → 적용</li>
<li>동시 접속 수 제한은 오른쪽 작업 창 <strong>고급 설정</strong> → 연결 → <strong>최대 연결 수</strong></li>
</ol>
<div class="callout trap"><b class="h">함정</b>합격자 후기: 문제에 인증 지시가 없으면 [권한 부여]와 [사용 권한]만 맞추면 된다고 합니다. 실제 서버에서 익명 접속이 되려면 <strong>FTP 인증</strong>의 익명 인증도 켜야 합니다. 지시문을 기준으로 하세요.</div>

<h2>⑤ 웹 사이트(IIS) 추가</h2>
<div class="callout tip"><b class="h">기출 예시</b>사이트 이름 ICQA, IP 192.168.100.10, 포트 80, 호스트 이름 www.icqa.or.kr, 192.168.100.0/24 대역에서만 접속 허용.</div>
<ol>
<li><strong>IIS 관리자</strong> → <strong>사이트</strong> 우클릭 → <strong>웹 사이트 추가</strong></li>
<li>사이트 이름, 실제 경로, 바인딩(종류 http, IP 주소, 포트, <strong>호스트 이름</strong>) → 확인</li>
<li>사이트 선택 → <strong>IP 주소 및 도메인 제한</strong> → <strong>허용 항목 추가</strong> → <strong>IP 주소 범위</strong> 선택 → 192.168.100.0 / 마스크 255.255.255.0</li>
<li>IP 하나로 웹 서버 2개: 작업 창 <strong>바인딩</strong> → <strong>[추가]</strong> → 다른 호스트 이름 입력</li>
<li>기본 문서: <strong>기본 문서</strong> 기능 → 필요 없는 항목 제거 / 새 항목 추가</li>
</ol>
<div class="callout trap"><b class="h">함정</b>"대역" 허용은 <strong>특정 IP 주소가 아니라 IP 주소 범위</strong>로 넣습니다. 실제 서버에서 "~에서만 허용"이 되려면 [기능 설정 편집]에서 지정되지 않은 클라이언트를 거부로 바꿔야 합니다.</div>

<h2>⑥ 사용자 계정 추가</h2>
<div class="callout tip"><b class="h">기출 예시</b>ID ICQA, 암호, 전체 이름, 설명, <strong>암호 변경할 수 없음</strong>, <strong>암호 사용 기간 제한 없음</strong>, 소속 그룹 Administrators, 홈 폴더 로컬 경로 C:\\icqa.</div>
<ol>
<li><strong>서버 관리자</strong> → <strong>도구</strong> → <strong>컴퓨터 관리</strong> → <strong>로컬 사용자 및 그룹</strong> → <strong>사용자</strong> 우클릭 → <strong>새 사용자</strong></li>
<li>사용자 이름, 전체 이름, 설명, 암호, 암호 확인 입력</li>
<li><strong>"다음 로그온할 때 반드시 암호 변경"의 체크를 먼저 끕니다.</strong> 그다음 "암호를 변경할 수 없음", "암호 사용 기간 제한 없음" 체크 → 만들기</li>
<li>사용자 더블클릭 → <strong>소속 그룹</strong> 탭 → 추가 → 고급 → <strong>지금 찾기</strong> → Administrators → 확인</li>
<li><strong>프로필</strong> 탭 → 홈 폴더 → <strong>로컬 경로</strong> 입력</li>
</ol>
<div class="callout trap"><b class="h">함정</b>"다음 로그온할 때 반드시 암호 변경"이 켜져 있으면 "암호를 변경할 수 없음"을 체크할 수 없습니다. 기본으로 켜져 있으니 먼저 끕니다.</div>

<h2>⑦ 로컬 보안 정책</h2>
<div class="callout tip"><b class="h">기출 예시</b>패스워드는 최소 10일에서 최대 20일 사용. 3번 로그인 실패하면 30분간 계정 잠금.</div>
<ol>
<li><strong>서버 관리자</strong> → <strong>도구</strong> → <strong>로컬 보안 정책</strong> (실행: <code>secpol.msc</code>) → <strong>계정 정책</strong></li>
<li><strong>암호 정책</strong> → <strong>최소 암호 사용 기간</strong> 10일, <strong>최대 암호 사용 기간</strong> 20일</li>
<li><strong>계정 잠금 정책</strong> → <strong>계정 잠금 임계값</strong> 3 → 확인하면 "제안 값" 창이 뜸 → <strong>계정 잠금 기간</strong> 30분</li>
</ol>
<div class="tbl"><table><thead><tr><th>지시문 표현</th><th>설정 이름</th></tr></thead><tbody>
<tr><td>최소 ○일 사용</td><td>최소 암호 사용 기간</td></tr>
<tr><td>최대 ○일 사용 / ○일마다 변경</td><td>최대 암호 사용 기간</td></tr>
<tr><td>○자 이상</td><td>최소 암호 길이</td></tr>
<tr><td>복잡하게(영문·숫자·특수문자)</td><td>암호는 복잡성을 만족해야 함</td></tr>
<tr><td>최근 ○개 다시 사용 금지</td><td>최근 암호 기억</td></tr>
<tr><td>○번 실패하면</td><td>계정 잠금 임계값</td></tr>
<tr><td>○분 동안 잠금</td><td>계정 잠금 기간</td></tr>
</tbody></table></div>

<h2>⑧ 서비스 설정</h2>
<div class="callout tip"><b class="h">기출 예시</b>원격 사용자가 Telnet을 쓸 필요가 없어졌다. 해당 기능을 <strong>중지</strong>시키고 <strong>다시 시작할 수 없게</strong> 하라.</div>
<ol>
<li><strong>서버 관리자</strong> → <strong>도구</strong> → <strong>서비스</strong> (실행: <code>services.msc</code>)</li>
<li><strong>Telnet</strong> 더블클릭 → <strong>시작 유형: 사용 안 함</strong> → 서비스 상태 <strong>[중지]</strong> → 확인</li>
<li>웹 서비스를 멈추라면 <strong>World Wide Web Publishing Service</strong> → [중지]</li>
</ol>
<div class="callout trap"><b class="h">함정</b>"다시 시작할 수 없게" = <strong>시작 유형을 사용 안 함</strong>으로 바꾸는 것입니다. [중지]만 누르면 반만 맞습니다.</div>`;

  const NET_ROUTER = `
<div class="callout"><b class="h">이 유형의 특징</b>3문제 × 5.5점 = 16.5점, 시험 맨 마지막 20분. 검은 명령어 창(Cisco 라우터 터미널)에 명령을 입력합니다. 연습은 ICQA 자료실의 <strong>Router Emulator 프로그램</strong>으로 합니다. 폰에서는 아래 <strong>연습창</strong>을 쓰세요.</div>

<h2>모드 = 방에 들어가는 순서</h2>
<div class="tbl"><table><thead><tr><th>프롬프트</th><th>모드</th><th>들어가는 명령</th><th>하는 일</th></tr></thead><tbody>
<tr><td><code>Router&gt;</code></td><td>사용자 모드</td><td>(처음 상태)</td><td>보기만 조금</td></tr>
<tr><td><code>Router#</code></td><td>특권(관리자) 모드</td><td><code>en</code> = <strong>en</strong>able</td><td>show로 확인, <strong>저장</strong></td></tr>
<tr><td><code>Router(config)#</code></td><td>전역 설정 모드</td><td><code>conf t</code> = <strong>conf</strong>igure <strong>t</strong>erminal</td><td>이름·게이트웨이·DHCP 등 장비 전체 설정</td></tr>
<tr><td><code>Router(config-if)#</code></td><td>인터페이스 모드</td><td><code>int fa0/0</code> = <strong>int</strong>erface FastEthernet 0/0</td><td>포트 하나의 IP·활성화·클럭</td></tr>
<tr><td><code>Router(config-line)#</code></td><td>라인 모드</td><td><code>line vty 0 4</code> / <code>line con 0</code></td><td>Telnet·콘솔 비밀번호</td></tr>
<tr><td><code>Router(dhcp-config)#</code></td><td>DHCP 풀 모드</td><td><code>ip dhcp pool 이름</code></td><td>DHCP 네트워크 지정</td></tr>
</tbody></table></div>
<p><code>exit</code> = 한 칸 뒤로, <code>end</code> = 특권 모드(#)로 바로. <strong>저장은 반드시 # 에서</strong> 합니다.</p>

<h2>꼭 외울 줄임말</h2>
<div class="tbl"><table><thead><tr><th>줄임</th><th>원래 말</th><th>뜻</th></tr></thead><tbody>
<tr><td><code>en</code></td><td>enable</td><td>특권 모드로</td></tr>
<tr><td><code>conf t</code></td><td>configure terminal</td><td>설정 모드로</td></tr>
<tr><td><code>int</code></td><td>interface</td><td>포트(인터페이스) 선택</td></tr>
<tr><td><code>fa0/0</code></td><td>FastEthernet 0/0</td><td>100Mbps 이더넷 포트</td></tr>
<tr><td><code>s2/0</code></td><td>Serial 2/0</td><td>시리얼(WAN) 포트</td></tr>
<tr><td><code>ip add</code></td><td>ip address</td><td>IP 주소 설정</td></tr>
<tr><td><code>no shut</code></td><td>no shutdown</td><td>포트 <strong>켜기(활성화)</strong></td></tr>
<tr><td><code>desc</code></td><td>description</td><td>포트 설명(주석)</td></tr>
<tr><td><code>sh</code></td><td>show</td><td>정보 보기</td></tr>
<tr><td><code>copy r s</code></td><td>copy running-config startup-config</td><td>지금 설정을 NVRAM에 <strong>저장</strong></td></tr>
<tr><td><code>vty</code></td><td>virtual teletype (가상 터미널)</td><td>Telnet/SSH 원격 접속 줄</td></tr>
<tr><td><code>con</code></td><td>console</td><td>콘솔 케이블 접속 줄</td></tr>
</tbody></table></div>
<p class="muted" style="font-size:13.5px">합격자들은 <code>en</code>, <code>conf t</code>, <code>ip add</code>, <code>copy r s</code> 같은 줄임말을 썼습니다. 헷갈리면 전체 명령을 쳐도 됩니다. NVRAM = Non-Volatile RAM(전원이 꺼져도 남는 메모리).</p>

<h2>기출 유형별 명령</h2>
<div data-sg-widget="rtypes"></div>

<div class="callout trap"><b class="h">자주 틀리는 점</b>
<ul>
<li><strong>저장</strong>: <code>copy r s</code> 다음에 <code>Destination filename [startup-config]?</code>가 나오면 <strong>Enter를 한 번 더</strong> 눌러야 저장됩니다.</li>
<li><strong>활성화</strong>라는 말이 있으면 <code>no shutdown</code>. 이걸 빼먹어 점수가 아슬아슬했다는 후기가 있습니다. 활성화 지시가 없으면 넣지 않습니다.</li>
<li><strong>로그인</strong>이라는 말이 있으면 비밀번호 다음에 <code>login</code>.</li>
<li><strong>보조 IP</strong>는 끝에 <code>secondary</code>.</li>
<li><strong>단위</strong>: <code>bandwidth</code>는 kbps, <code>clock rate</code>는 bps (72k → <code>72000</code>).</li>
<li><code>exec-timeout</code>은 <strong>분 초</strong> 순서 (3분 50초 → <code>exec-timeout 3 50</code>).</li>
<li>비밀번호·설명은 <strong>대소문자</strong>를 지시문과 똑같이 (ICQA ≠ icqa).</li>
<li>ROUTER1과 ROUTER2를 헷갈리지 않습니다.</li>
</ul></div>

<h2>라우터 연습창</h2>
<p>미션을 고르고, 명령을 직접 쳐 보세요. 줄임말도 됩니다. <code>?</code>를 치면 지금 모드에서 쓸 수 있는 명령이 나옵니다. 저장하면 자동으로 채점합니다.</p>
<div data-sg-widget="router"></div>`;

  // 라우터 기출 유형 (rtypes 위젯과 미션이 함께 씁니다)
  const RTYPES = [
    { g: '인터페이스', t: 'FastEthernet 0/0에 IP 192.168.0.100/24 설정', c: ['en', 'conf t', 'interface fastethernet 0/0', 'ip address 192.168.0.100 255.255.255.0', 'end', 'copy r s'], n: '"활성화"까지 지시하면 ip address 다음에 no shutdown.' },
    { g: '인터페이스', t: 'Serial 2/0 활성화, IP 192.168.0.101/24, 보조 IP 192.168.0.102/24', c: ['en', 'conf t', 'interface serial 2/0', 'ip address 192.168.0.101 255.255.255.0', 'ip address 192.168.0.102 255.255.255.0 secondary', 'no shutdown', 'end', 'copy r s'], n: '두 번째 IP는 반드시 secondary.' },
    { g: '인터페이스', t: 'Serial 2/0 대역폭 2048', c: ['en', 'conf t', 'interface serial 2/0', 'bandwidth 2048', 'end', 'copy r s'], n: 'bandwidth 단위는 kbps.' },
    { g: '인터페이스', t: 'Serial 2/0 클럭 속도 72k', c: ['en', 'conf t', 'interface serial 2/0', 'clock rate 72000', 'end', 'copy r s'], n: 'clock rate 단위는 bps. 72k = 72000.' },
    { g: '인터페이스', t: 'FastEthernet 0/0 설명(description) ICQA', c: ['en', 'conf t', 'interface fastethernet 0/0', 'description ICQA', 'end', 'copy r s'], n: '대소문자 그대로.' },
    { g: '인터페이스', t: 'Serial 2/0 프레임 릴레이 캡슐화', c: ['en', 'conf t', 'interface serial 2/0', 'encapsulation frame-relay', 'end', 'copy r s'], n: 'DLCI(Data Link Connection Identifier) 번호 지시가 있을 때만 frame-relay interface-dlci 번호(16~1007).' },
    { g: '확인(show)', t: '라우팅 테이블 확인', c: ['en', 'show ip route', 'copy r s'], n: 'show 문제도 마지막에 저장하는 것이 합격자들의 풀이입니다.' },
    { g: '확인(show)', t: '인터페이스 정보 / 사용자 / 플래시 / 프로세스 / 호스트 / 버전 확인', c: ['en', 'show interfaces', 'show users', 'show flash', 'show processes', 'show hosts', 'show version'], n: '문제에서 묻는 것 하나만 치고 copy r s.' },
    { g: '라인', t: 'Telnet 비밀번호 icqa, 로그인 설정', c: ['en', 'conf t', 'line vty 0 4', 'password icqa', 'login', 'end', 'copy r s'], n: 'Telnet = line vty 0 4.' },
    { g: '라인', t: 'Telnet 3분 50초 입력 없으면 자동 종료', c: ['en', 'conf t', 'line vty 0 4', 'exec-timeout 3 50', 'end', 'copy r s'], n: '분 초 순서.' },
    { g: '라인', t: 'console 0 비밀번호 ICQA, 로그인 설정', c: ['en', 'conf t', 'line console 0', 'password ICQA', 'login', 'end', 'copy r s'], n: '콘솔 = line console 0.' },
    { g: '라인', t: 'Telnet 대신 SSH로만 접속', c: ['en', 'conf t', 'line vty 0 4', 'transport input ssh', 'end', 'copy r s'], n: 'SSH = Secure Shell.' },
    { g: '기타', t: '호스트 이름 network2, console 비밀번호 route5 + 로그인', c: ['en', 'conf t', 'hostname network2', 'line console 0', 'password route5', 'login', 'end', 'copy r s'], n: 'hostname을 바꾸면 프롬프트 이름이 바로 바뀝니다.' },
    { g: '기타', t: '기본 게이트웨이 192.168.0.10', c: ['en', 'conf t', 'ip default-gateway 192.168.0.10', 'end', 'copy r s'], n: '기본 네트워크는 ip default-network.' },
    { g: '기타', t: 'DHCP 풀 이름 icqa, 네트워크 192.168.100.0/24', c: ['en', 'conf t', 'ip dhcp pool icqa', 'network 192.168.100.0 255.255.255.0', 'end', 'copy r s'], n: '풀 이름을 먼저 만들고 그 안에서 network.' },
    { g: '기타', t: 'SNMP 커뮤니티 ICQA 읽기 전용', c: ['en', 'conf t', 'snmp-server community ICQA ro', 'end', 'copy r s'], n: 'ro = read-only(읽기 전용), rw = read-write. SNMP = Simple Network Management Protocol.' },
    { g: '기타', t: '정적 라우팅: 192.168.20.0/24는 192.168.0.1로', c: ['en', 'conf t', 'ip route 192.168.20.0 255.255.255.0 192.168.0.1', 'end', 'copy r s'], n: 'ip route 목적지 마스크 다음홉.' },
  ];

  // 라우터 연습 미션 — check(s)는 저장된 설정(saved)으로 채점합니다.
  const MISSIONS = [
    { id: 'm01', t: 'FastEthernet 0/0에 IP 192.168.0.100/24를 설정하고 저장하세요.', k: s => s.ifs['FastEthernet0/0'].ip === '192.168.0.100' && s.ifs['FastEthernet0/0'].mask === '255.255.255.0' },
    { id: 'm02', t: 'Serial 2/0의 대역폭을 2048로 설정하고 저장하세요.', k: s => s.ifs['Serial2/0'].bw === 2048 },
    { id: 'm03', t: 'Serial 2/0의 클럭 속도를 72k로 설정하고 저장하세요.', k: s => s.ifs['Serial2/0'].clock === 72000 },
    { id: 'm04', t: 'FastEthernet 0/0의 Description을 ICQA로 설정하고 저장하세요. (대소문자 구분)', k: s => s.ifs['FastEthernet0/0'].desc === 'ICQA' },
    { id: 'm05', t: 'Serial 2/0을 활성화하고 IP 192.168.0.101/24, 보조 IP 192.168.0.102/24를 설정한 뒤 저장하세요.', k: s => { const i = s.ifs['Serial2/0']; return i.ip === '192.168.0.101' && i.mask === '255.255.255.0' && i.sec.some(x => x.ip === '192.168.0.102' && x.mask === '255.255.255.0') && !i.shut; } },
    { id: 'm06', t: '기본 게이트웨이를 192.168.0.10으로 설정하고 저장하세요.', k: s => s.gw === '192.168.0.10' },
    { id: 'm07', t: 'DHCP 서버 이름(풀)을 icqa로 만들고, 네트워크 192.168.100.0/24를 설정한 뒤 저장하세요.', k: s => s.pools.icqa && s.pools.icqa.net === '192.168.100.0' && s.pools.icqa.mask === '255.255.255.0' },
    { id: 'm08', t: 'Telnet 접속 비밀번호를 icqa로 설정하고 로그인하도록 한 뒤 저장하세요.', k: s => s.lines.vty.pw === 'icqa' && s.lines.vty.login },
    { id: 'm09', t: 'Telnet 세션이 3분 50초 동안 입력이 없으면 자동 종료되게 하고 저장하세요.', k: s => s.lines.vty.tm && s.lines.vty.tm[0] === 3 && s.lines.vty.tm[1] === 50 },
    { id: 'm10', t: 'console 0의 비밀번호를 ICQA로 설정하고 로그인하도록 한 뒤 저장하세요.', k: s => s.lines.con.pw === 'ICQA' && s.lines.con.login },
    { id: 'm11', t: '호스트 이름을 network2로 바꾸고, console 비밀번호를 route5로 설정해 로그인하도록 한 뒤 저장하세요.', k: s => s.host === 'network2' && s.lines.con.pw === 'route5' && s.lines.con.login },
    { id: 'm12', t: 'Serial 2/0을 Frame Relay 방식으로 캡슐화하고 저장하세요.', k: s => s.ifs['Serial2/0'].encap === 'frame-relay' },
    { id: 'm13', t: '라우팅 테이블을 확인하고 저장하세요.', k: s => s.shows.includes('ip route') },
    { id: 'm14', t: '플래시 메모리 내용을 확인하고 저장하세요.', k: s => s.shows.includes('flash') },
    { id: 'm15', t: 'SNMP 커뮤니티를 ICQA로, 읽기 전용으로 설정하고 저장하세요.', k: s => s.snmp.some(x => x.name === 'ICQA' && x.mode === 'ro') },
    { id: 'm16', t: 'Telnet 대신 SSH로만 원격 접속하도록 바꾸고 저장하세요.', k: s => s.lines.vty.tr === 'ssh' },
    { id: 'm17', t: '목적지 192.168.20.0/24로 가는 정적 경로를 다음 홉 192.168.0.1로 설정하고 저장하세요.', k: s => s.routes.some(r => r.net === '192.168.20.0' && r.mask === '255.255.255.0' && r.via === '192.168.0.1') },
  ];
  // 미션 번호 → 정답 명령 (RTYPES와 같은 내용)
  const MISSION_CMDS = {
    m01: ['en', 'conf t', 'int fa0/0', 'ip add 192.168.0.100 255.255.255.0', 'end', 'copy r s', '(Enter)'],
    m02: ['en', 'conf t', 'int s2/0', 'bandwidth 2048', 'end', 'copy r s', '(Enter)'],
    m03: ['en', 'conf t', 'int s2/0', 'clock rate 72000', 'end', 'copy r s', '(Enter)'],
    m04: ['en', 'conf t', 'int fa0/0', 'description ICQA', 'end', 'copy r s', '(Enter)'],
    m05: ['en', 'conf t', 'int s2/0', 'ip add 192.168.0.101 255.255.255.0', 'ip add 192.168.0.102 255.255.255.0 secondary', 'no shutdown', 'end', 'copy r s', '(Enter)'],
    m06: ['en', 'conf t', 'ip default-gateway 192.168.0.10', 'end', 'copy r s', '(Enter)'],
    m07: ['en', 'conf t', 'ip dhcp pool icqa', 'network 192.168.100.0 255.255.255.0', 'end', 'copy r s', '(Enter)'],
    m08: ['en', 'conf t', 'line vty 0 4', 'password icqa', 'login', 'end', 'copy r s', '(Enter)'],
    m09: ['en', 'conf t', 'line vty 0 4', 'exec-timeout 3 50', 'end', 'copy r s', '(Enter)'],
    m10: ['en', 'conf t', 'line console 0', 'password ICQA', 'login', 'end', 'copy r s', '(Enter)'],
    m11: ['en', 'conf t', 'hostname network2', 'line console 0', 'password route5', 'login', 'end', 'copy r s', '(Enter)'],
    m12: ['en', 'conf t', 'int s2/0', 'encapsulation frame-relay', 'end', 'copy r s', '(Enter)'],
    m13: ['en', 'show ip route', 'copy r s', '(Enter)'],
    m14: ['en', 'show flash', 'copy r s', '(Enter)'],
    m15: ['en', 'conf t', 'snmp-server community ICQA ro', 'end', 'copy r s', '(Enter)'],
    m16: ['en', 'conf t', 'line vty 0 4', 'transport input ssh', 'end', 'copy r s', '(Enter)'],
    m17: ['en', 'conf t', 'ip route 192.168.20.0 255.255.255.0 192.168.0.1', 'end', 'copy r s', '(Enter)'],
  };

  const NET_LINUX = `
<div class="callout"><b class="h">이 유형의 특징</b>단답형 6문제 안에 보통 <strong>리눅스 1~2문제</strong>가 나옵니다. 명령어나 파일 이름을 <strong>직접 입력</strong>합니다. ★ 표시는 실기 기출로 확인된 것입니다.</div>

<h2>기출 명령어</h2>
<div class="tbl"><table><thead><tr><th>명령</th><th>원래 말</th><th>뜻</th></tr></thead><tbody>
<tr><td><code>passwd</code> ★</td><td>password</td><td>사용자 비밀번호 설정·변경</td></tr>
<tr><td><code>top</code> ★</td><td>table of processes</td><td>CPU·메모리·프로세스를 <strong>실시간</strong>으로 보기</td></tr>
<tr><td><code>netstat</code> ★</td><td>network statistics</td><td>라우팅 테이블(-r), 인터페이스(-i), 네트워크 연결 상태 보기</td></tr>
<tr><td><code>traceroute</code> ★</td><td>trace route</td><td>목적지까지 거치는 경로 보기 (리눅스는 기본 <strong>UDP</strong>)</td></tr>
<tr><td><code>tracert</code></td><td>trace route</td><td>같은 일을 하는 <strong>윈도우</strong> 명령 (<strong>ICMP</strong> 사용)</td></tr>
<tr><td><code>chmod 755 ICQA</code> ★</td><td>change mode</td><td>권한 바꾸기: 소유자 rwx, 그룹·기타 r-x</td></tr>
<tr><td><code>grub</code> ★</td><td>GRand Unified Bootloader</td><td>리눅스 부트로더</td></tr>
<tr><td><code>init</code> ★</td><td>initialization</td><td>커널 다음에 처음 실행되는 프로세스(PID 1). <code>init 0</code> 종료, <code>init 6</code> 재부팅. 요즘 배포판은 systemd가 이 역할</td></tr>
<tr><td><code>/etc/fstab</code> ★</td><td>file system table</td><td>부팅할 때 자동으로 마운트할 목록</td></tr>
<tr><td><code>echo 0 &gt; /proc/sys/net/ipv4/icmp_echo_ignore_all</code> ★</td><td>—</td><td>ping(ICMP echo)에 <strong>응답하도록</strong> 설정 (1이면 무시)</td></tr>
</tbody></table></div>

<h2>함께 외우면 좋은 것</h2>
<div class="tbl"><table><thead><tr><th>명령·파일</th><th>뜻</th></tr></thead><tbody>
<tr><td><code>ps</code> (process status)</td><td>지금 실행 중인 프로세스 목록 (한 번 출력)</td></tr>
<tr><td><code>kill</code></td><td>프로세스 종료 (번호로)</td></tr>
<tr><td><code>chown</code> (change owner)</td><td>파일 소유자 바꾸기</td></tr>
<tr><td><code>useradd</code> / <code>userdel</code></td><td>사용자 추가 / 삭제</td></tr>
<tr><td><code>ifconfig</code> / <code>ip addr</code></td><td>네트워크 인터페이스 IP 보기·설정</td></tr>
<tr><td><code>nslookup</code> / <code>dig</code></td><td>DNS 조회</td></tr>
<tr><td><code>df</code> (disk free) / <code>du</code> (disk usage)</td><td>디스크 남은 공간 / 폴더가 쓴 공간</td></tr>
<tr><td><code>mount</code> / <code>umount</code></td><td>장치 연결 / 해제</td></tr>
<tr><td><code>/etc/passwd</code></td><td>사용자 계정 정보</td></tr>
<tr><td><code>/etc/shadow</code></td><td>암호(해시) 정보</td></tr>
<tr><td><code>/etc/hosts</code></td><td>이름 ↔ IP 직접 적는 파일</td></tr>
<tr><td><code>/etc/resolv.conf</code></td><td>DNS 서버 주소 설정</td></tr>
</tbody></table></div>

<h2>권한 숫자 계산기 (chmod)</h2>
<p>r(read, 읽기)=4, w(write, 쓰기)=2, x(execute, 실행)=1. 소유자·그룹·기타 순서로 더합니다. 755 = rwx(7) r-x(5) r-x(5).</p>
<div data-sg-widget="chmod"></div>`;

  const NET_SHORT = `
<div class="callout"><b class="h">이 유형의 특징</b>6문제(리눅스 포함). 보기 중 하나 또는 <strong>여러 개를 고르는</strong> 문제, 프로토콜 이름을 <strong>직접 입력</strong>하는 문제가 나옵니다. 필기 때 공부한 내용입니다. ★ = 실기 기출로 확인된 것.</div>

<h2>기출로 확인된 정답</h2>
<div class="tbl"><table><thead><tr><th>문제</th><th>정답</th></tr></thead><tbody>
<tr><td>스위치에서 논리적으로 LAN을 나누는 기술 ★</td><td><strong>VLAN</strong> (Virtual LAN)</td></tr>
<tr><td>스위치끼리 VLAN 정보를 자동으로 맞추는 프로토콜 ★</td><td><strong>VTP</strong> (VLAN Trunking Protocol)</td></tr>
<tr><td>링크 상태 방식, 최단 경로 계산 ★</td><td><strong>OSPF</strong> (Open Shortest Path First)</td></tr>
<tr><td>거리 벡터, 최대 홉 15, 30초마다 업데이트 ★</td><td><strong>RIP</strong> (Routing Information Protocol)</td></tr>
<tr><td>네트워크 계층 프로토콜 ★</td><td>IP, <strong>ICMP, IGMP, ARP</strong>, RARP</td></tr>
<tr><td>전송 계층 프로토콜 ★</td><td><strong>TCP, UDP</strong></td></tr>
<tr><td>코드 변환·암호화·압축 담당 계층 ★</td><td><strong>표현 계층</strong> (6계층)</td></tr>
<tr><td>UDP 특징 ★</td><td>비연결형, TCP보다 빠름, 흐름·혼잡 제어 없음</td></tr>
<tr><td>IPv6 특징 ★</td><td>128비트, 확장 헤더, 유니·멀티·애니캐스트(브로드캐스트 없음), 보안·이동성 향상</td></tr>
<tr><td>192.168.1.10 / 255.255.255.240의 네트워크 주소 ★</td><td><strong>192.168.1.0</strong></td></tr>
<tr><td>IPSec 구성 ★</td><td><strong>AH</strong>(인증·무결성) · <strong>ESP</strong>(인증+암호화) · SA(보안 연관)</td></tr>
<tr><td>미러링 방식 RAID ★</td><td><strong>RAID 1</strong></td></tr>
<tr><td>임의 접근 읽기·쓰기 주기억 장치 / 화면 전용 메모리 ★</td><td><strong>RAM</strong> / <strong>VRAM</strong></td></tr>
<tr><td>웹(HTTP) 트래픽을 걸러 웹 공격을 막는 장비 ★</td><td><strong>WAF</strong> (Web Application Firewall)</td></tr>
<tr><td>인증서로 암호화한 웹 / 암호화 원격 접속 ★</td><td><strong>HTTPS</strong> / <strong>SSH</strong></td></tr>
</tbody></table></div>

<h2>ICMP 타입 ★</h2>
<div class="tbl"><table><thead><tr><th>타입</th><th>뜻</th></tr></thead><tbody>
<tr><td>0</td><td>Echo Reply (에코 응답)</td></tr>
<tr><td>3</td><td>Destination Unreachable (목적지 도달 불가)</td></tr>
<tr><td>4</td><td>Source Quench (발신 억제)</td></tr>
<tr><td>5</td><td>Redirect (경로 재지정)</td></tr>
<tr><td>8</td><td>Echo Request (에코 요청)</td></tr>
<tr><td>11</td><td>Time Exceeded (시간 초과)</td></tr>
</tbody></table></div>

<h2>포트 번호 (짝 맞추기로 연습)</h2>
<div class="tbl"><table><thead><tr><th>포트</th><th>프로토콜</th><th>포트</th><th>프로토콜</th></tr></thead><tbody>
<tr><td>20/21</td><td>FTP</td><td>110</td><td>POP3</td></tr>
<tr><td>22</td><td>SSH</td><td>123</td><td>NTP</td></tr>
<tr><td>23</td><td>Telnet</td><td>143</td><td>IMAP</td></tr>
<tr><td>25</td><td>SMTP</td><td>161/162</td><td>SNMP</td></tr>
<tr><td>53</td><td>DNS</td><td>443</td><td>HTTPS</td></tr>
<tr><td>67/68</td><td>DHCP</td><td>3389</td><td>RDP (원격 데스크톱)</td></tr>
<tr><td>69</td><td>TFTP</td><td>80</td><td>HTTP</td></tr>
</tbody></table></div>
<div data-sg-widget="match" data-set="ports"></div>

<h2>OSI 7계층 ↔ 장비·프로토콜</h2>
<div data-sg-widget="match" data-set="osi"></div>
<div class="callout trap"><b class="h">새 유형 주의</b>2026년 1회 실기에서 교재에 없던 보안 문제(특히 <strong>NGFW</strong>, Next-Generation Firewall = 차세대 방화벽)가 나왔다는 기록이 있습니다(나무위키 1급 항목). 2026년 3월 2급 합격 후기에는 "신유형이 딱히 없었다"고 적혀 있습니다. NGFW는 "애플리케이션까지 구분하고, 침입 방지(IPS)를 합친 방화벽"이라고 정도만 알아 두세요.</div>`;

  // ═════════════ PC정비사 2급 실기 ═════════════
  const PC_START = `
<h2>시험 한눈에 보기</h2>
<div class="tbl"><table><tbody>
<tr><td>시험일</td><td>2026년 ${EXAM.dateLabel} · 2026년 제4회 (네트워크관리사와 같은 날)</td></tr>
<tr><td>원서 접수</td><td>${EXAM.apply}</td></tr>
<tr><td>합격 발표</td><td>${EXAM.result}</td></tr>
<tr><td>시험 시간</td><td>80분 · 협회 안내: 1 SET(1~20문항), 작업/서술/선택형</td></tr>
<tr><td>합격 기준</td><td>100점 만점에 <strong>60점 이상</strong> (18문제 중 11문제 이상, 나무위키 기준)</td></tr>
<tr><td>검정료</td><td>${EXAM.fee}</td></tr>
</tbody></table></div>

<h2>협회 공식 과목</h2>
<ul>
<li>PC 분해 조립 및 시스템 점검</li>
<li>PC 진단과 처방</li>
<li>H/W 업그레이드</li>
<li>PC 네트워크 구축</li>
</ul>

<h2>실제 문제 형태 (후기·강의 목차 기준)</h2>
<div class="tbl"><table><thead><tr><th>형태</th><th>내용</th><th>이 메뉴</th></tr></thead><tbody>
<tr><td>RJ45 케이블 만들기</td><td>다이렉트/크로스 제작</td><td>케이블</td></tr>
<tr><td>작업형 시뮬레이션</td><td>CMOS(BIOS) 설정, 가상 윈도우 설정(네트워크·원격 데스크톱·프린터·폴더 권한)</td><td>CMOS 설정, 윈도우·레지스트리</td></tr>
<tr><td>콘솔형</td><td>명령 프롬프트 명령어 입력</td><td>콘솔 명령어</td></tr>
<tr><td>레지스트리</td><td>키·값 찾기, 만들기</td><td>윈도우·레지스트리</td></tr>
<tr><td>드래그 앤 드롭</td><td>메인보드 칩셋, 기억장치, 부품 이름 맞추기</td><td>부품·드래그</td></tr>
<tr><td>단답형·객관식 다택형</td><td>PC와 주변기기 지식</td><td>실전 문제</td></tr>
</tbody></table></div>

<div class="callout tip"><b class="h">합격자 팁</b>
<ul>
<li><strong>부분 점수가 없습니다.</strong> 작업형 시뮬레이션과 콘솔형은 기출이 반복되므로 반드시 다 맞힙니다.</li>
<li>레지스트리는 범위가 넓지만 "문제 안에 답이 있다"고 합니다. 키를 하나씩 열어 보며 찾습니다.</li>
<li>드래그 문제와 다지선다가 가장 어렵다는 후기가 많습니다. 1~2문제는 버린다고 생각해도 됩니다.</li>
<li>영어와 한글 답을 모두 인정하는 용어는 <strong>한글로</strong> 쓰면 철자 실수를 줄입니다.</li>
</ul></div>
<p class="muted" style="font-size:13.5px">PC정비사 실기는 최근 공개 후기가 적습니다. 위 형태는 나무위키, 2009년 합격 후기, 실기 강의 목차를 합쳐 정리한 것입니다. ICQA 실습용 에뮬레이터로 지금 화면을 꼭 확인하세요.</p>

<h2>연습 프로그램 (ICQA 자료실 · 윈도우 PC용)</h2>
<div class="tbl"><table><tbody>
<tr><td>PC정비사 실습용 에뮬레이터 (32/64bit)</td><td>CMOS·윈도우 작업형 연습</td></tr>
<tr><td>ICQA 모의고사 예제 프로그램 (32/64bit)</td><td>실제 시험 화면 체험</td></tr>
<tr><td>국가공인 PC정비사 1/2급 출제기준</td><td>공식 출제 범위 파일</td></tr>
</tbody></table></div>
<p><a class="btn btn-outline btn-sm" href="https://www.icqa.or.kr/cn/board/dataroom?sca=PC%EC%A0%95%EB%B9%84%EC%82%AC" target="_blank" rel="noopener">ICQA 자료실 · PC정비사 ↗</a></p>`;

  const PC_CMOS = `
<div class="callout"><b class="h">이 유형의 특징</b>실기 강의들은 "에뮬레이터의 CMOS Setup 문제"를 따로 다룹니다. 필기 기출에도 나오는 <strong>Award BIOS</strong> 메뉴 이름을 기준으로 정리했습니다. 메인보드마다 메뉴 이름이 조금씩 다릅니다.</div>

<h2>메뉴별 하는 일</h2>
<div class="tbl"><table><thead><tr><th>메뉴</th><th>하는 일</th></tr></thead><tbody>
<tr><td>Standard CMOS Features</td><td><strong>날짜·시간</strong>, 하드디스크·드라이브 정보, 메모리 용량 표시, Halt On(어떤 오류에서 멈출지)</td></tr>
<tr><td>Advanced BIOS Features</td><td><strong>부팅 순서</strong>(First/Second/Third Boot Device), 빠른 POST, 부팅 시 NumLock, <strong>Security Option</strong></td></tr>
<tr><td>Advanced Chipset Features</td><td>메모리 타이밍 등 칩셋 설정</td></tr>
<tr><td>Integrated Peripherals</td><td><strong>온보드 장치</strong> 켜기/끄기: LAN, 사운드, USB, SATA 모드(IDE/AHCI/RAID)</td></tr>
<tr><td>Power Management Setup</td><td><strong>절전</strong>·ACPI, Wake on LAN, 전원 버튼 동작, 정전 후 전원 복구</td></tr>
<tr><td>PnP/PCI Configurations</td><td>IRQ 등 장치 자원 배정</td></tr>
<tr><td>PC Health Status</td><td><strong>CPU 온도, 팬 속도, 전압</strong> 확인</td></tr>
<tr><td>Frequency/Voltage Control</td><td>CPU 클럭·전압 (오버클럭)</td></tr>
<tr><td>Load Fail-Safe Defaults</td><td>가장 안전한 기본값 불러오기</td></tr>
<tr><td>Load Optimized Defaults</td><td>최적 기본값 불러오기</td></tr>
<tr><td>Set Supervisor / User Password</td><td>관리자 / 사용자 암호 설정</td></tr>
<tr><td>Save &amp; Exit Setup / Exit Without Saving</td><td>저장 후 종료(<kbd>F10</kbd>) / 저장 안 하고 종료</td></tr>
</tbody></table></div>

<div class="callout tip"><b class="h">Security Option 구분</b><strong>Setup</strong> = BIOS 설정 화면에 들어갈 때만 암호를 물음. <strong>System</strong> = 컴퓨터를 켤 때마다(부팅할 때) 암호를 물음.</div>
<div class="callout trap"><b class="h">자주 나오는 고장</b>BIOS 설정이 자꾸 초기화됨 → <strong>CMOS 배터리(CR2032) 방전</strong>. BIOS 암호를 잊음 → <strong>CMOS Clear 점퍼</strong>를 쇼트하거나 배터리를 잠시 빼서 초기화. NCQ(Native Command Queuing)를 쓰려면 SATA 모드를 <strong>AHCI</strong>로.</div>

<h2>키 조작</h2>
<ul>
<li>진입: 전원을 켜고 <kbd>Del</kbd> (데스크톱 대부분)</li>
<li>이동: 방향키 · 선택: <kbd>Enter</kbd> · 값 바꾸기: <kbd>PgUp</kbd>/<kbd>PgDn</kbd> 또는 <kbd>+</kbd>/<kbd>-</kbd></li>
<li>뒤로: <kbd>Esc</kbd> · 저장 후 종료: <kbd>F10</kbd> → <kbd>Y</kbd></li>
</ul>

<h2>BIOS 연습 화면</h2>
<p>미션을 고르고, 메뉴를 눌러 들어가 값을 바꾼 뒤 <strong>Save &amp; Exit</strong>로 저장하세요. 저장하면 자동으로 채점합니다.</p>
<div data-sg-widget="bios"></div>
<div data-sg-widget="match" data-set="bios"></div>`;

  // BIOS 연습 화면 설정 (Award 스타일, 연습용)
  const BIOS = {
    menus: [
      { id: 'std', name: 'Standard CMOS Features', items: [
        { id: 'date', name: 'Date (mm:dd:yy)', ro: 'Sun, Dec 6 2026' },
        { id: 'time', name: 'Time (hh:mm:ss)', ro: '09:20:00' },
        { id: 'halt', name: 'Halt On', opts: ['All Errors', 'No Errors', 'All, But Keyboard'], def: 0 },
        { id: 'mem', name: 'Total Memory', ro: '8192M' },
      ] },
      { id: 'adv', name: 'Advanced BIOS Features', items: [
        { id: 'boot1', name: 'First Boot Device', opts: ['Hard Disk', 'CDROM', 'USB-HDD', 'LAN', 'Disabled'], def: 0 },
        { id: 'boot2', name: 'Second Boot Device', opts: ['Hard Disk', 'CDROM', 'USB-HDD', 'LAN', 'Disabled'], def: 1 },
        { id: 'boot3', name: 'Third Boot Device', opts: ['Hard Disk', 'CDROM', 'USB-HDD', 'LAN', 'Disabled'], def: 2 },
        { id: 'qpost', name: 'Quick Power On Self Test', opts: ['Enabled', 'Disabled'], def: 0 },
        { id: 'numlock', name: 'Boot Up NumLock Status', opts: ['On', 'Off'], def: 0 },
        { id: 'secopt', name: 'Security Option', opts: ['Setup', 'System'], def: 0 },
      ] },
      { id: 'chip', name: 'Advanced Chipset Features', items: [
        { id: 'dram', name: 'DRAM Timing Selectable', opts: ['By SPD', 'Manual'], def: 0 },
      ] },
      { id: 'per', name: 'Integrated Peripherals', items: [
        { id: 'lan', name: 'Onboard LAN Controller', opts: ['Enabled', 'Disabled'], def: 0 },
        { id: 'audio', name: 'Onboard Audio (HD Audio)', opts: ['Enabled', 'Disabled'], def: 0 },
        { id: 'usb', name: 'USB Controller', opts: ['Enabled', 'Disabled'], def: 0 },
        { id: 'usbkb', name: 'USB Keyboard Support', opts: ['Enabled', 'Disabled'], def: 0 },
        { id: 'sata', name: 'SATA Mode', opts: ['IDE', 'AHCI', 'RAID'], def: 0 },
      ] },
      { id: 'pwr', name: 'Power Management Setup', items: [
        { id: 'acpi', name: 'ACPI Suspend Type', opts: ['S1(POS)', 'S3(STR)'], def: 1 },
        { id: 'wol', name: 'Power On by LAN (Wake on LAN)', opts: ['Disabled', 'Enabled'], def: 0 },
        { id: 'pwrbtn', name: 'Soft-Off by PWR-BTTN', opts: ['Instant-Off', 'Delay 4 Sec.'], def: 0 },
        { id: 'acback', name: 'AC Back Function', opts: ['Soft-Off', 'Full-On', 'Memory'], def: 0 },
      ] },
      { id: 'pnp', name: 'PnP/PCI Configurations', items: [
        { id: 'res', name: 'Resources Controlled By', opts: ['Auto(ESCD)', 'Manual'], def: 0 },
      ] },
      { id: 'health', name: 'PC Health Status', items: [
        { id: 'ctemp', name: 'CPU Temperature', ro: '42°C/107°F' },
        { id: 'cfan', name: 'CPU FAN Speed', ro: '2410 RPM' },
        { id: 'vcore', name: 'Vcore', ro: '1.21 V' },
      ] },
      { id: 'freq', name: 'Frequency/Voltage Control', items: [
        { id: 'ratio', name: 'CPU Clock Ratio', opts: ['Auto', '36X', '40X'], def: 0 },
      ] },
      { id: 'failsafe', name: 'Load Fail-Safe Defaults', act: 'defaults' },
      { id: 'optimized', name: 'Load Optimized Defaults', act: 'defaults' },
      { id: 'supw', name: 'Set Supervisor Password', act: 'supw' },
      { id: 'uspw', name: 'Set User Password', act: 'uspw' },
      { id: 'save', name: 'Save & Exit Setup', act: 'save' },
      { id: 'quit', name: 'Exit Without Saving', act: 'quit' },
    ],
    // 미션: k(v) — v는 저장된 값(이름 문자열), pw는 암호
    tasks: [
      { id: 'b01', t: '첫 번째 부팅 장치를 CDROM, 두 번째를 Hard Disk로 바꾸고 저장하세요.', k: v => v.boot1 === 'CDROM' && v.boot2 === 'Hard Disk' },
      { id: 'b02', t: '관리자 암호를 icqa로 설정하고, 컴퓨터를 켤 때마다 암호를 묻도록 한 뒤 저장하세요.', k: v => v.supw === 'icqa' && v.secopt === 'System' },
      { id: 'b03', t: '온보드 LAN을 사용하지 않도록 바꾸고 저장하세요.', k: v => v.lan === 'Disabled' },
      { id: 'b04', t: 'NCQ를 쓸 수 있도록 SATA 모드를 바꾸고 저장하세요.', k: v => v.sata === 'AHCI' },
      { id: 'b05', t: '랜카드 신호로 컴퓨터가 켜지도록(Wake on LAN) 하고 저장하세요.', k: v => v.wol === 'Enabled' },
      { id: 'b06', t: '부팅할 때 NumLock이 꺼진 상태가 되게 하고 저장하세요.', k: v => v.numlock === 'Off' },
      { id: 'b07', t: '정전 뒤 전기가 다시 들어오면 정전 직전 상태로 돌아가게(AC Back Function) 하고 저장하세요.', k: v => v.acback === 'Memory' },
      { id: 'b08', t: 'USB 키보드를 쓸 수 없도록 하고 저장하세요.', k: v => v.usbkb === 'Disabled' },
    ],
    hints: {
      b01: 'Advanced BIOS Features → First Boot Device: CDROM, Second Boot Device: Hard Disk → Esc → Save & Exit Setup → Y',
      b02: 'Set Supervisor Password → icqa 입력 → Advanced BIOS Features → Security Option: System → Save & Exit',
      b03: 'Integrated Peripherals → Onboard LAN Controller: Disabled → Save & Exit',
      b04: 'Integrated Peripherals → SATA Mode: AHCI → Save & Exit',
      b05: 'Power Management Setup → Power On by LAN: Enabled → Save & Exit',
      b06: 'Advanced BIOS Features → Boot Up NumLock Status: Off → Save & Exit',
      b07: 'Power Management Setup → AC Back Function: Memory (Soft-Off = 꺼진 채, Full-On = 무조건 켜짐) → Save & Exit',
      b08: 'Integrated Peripherals → USB Keyboard Support: Disabled → Save & Exit',
    },
  };

  const PC_CONSOLE = `
<div class="callout"><b class="h">이 유형의 특징</b>명령 프롬프트(cmd)에 명령을 <strong>직접 입력</strong>합니다. 기출에서 반복되므로 <strong>반드시 다 맞혀야 하는</strong> 유형입니다(합격 후기). 옵션 글자(/all, -t 등)까지 외웁니다.</div>

<h2>네트워크 명령</h2>
<div class="tbl"><table><thead><tr><th>명령</th><th>원래 말</th><th>뜻</th></tr></thead><tbody>
<tr><td><code>ipconfig</code></td><td>IP configuration</td><td>IP 주소·서브넷·게이트웨이 보기</td></tr>
<tr><td><code>ipconfig /all</code></td><td></td><td>MAC 주소·DNS·DHCP까지 <strong>전부</strong> 보기</td></tr>
<tr><td><code>ipconfig /release</code> · <code>/renew</code></td><td></td><td>DHCP IP 반납 · 다시 받기</td></tr>
<tr><td><code>ipconfig /flushdns</code> · <code>/displaydns</code></td><td></td><td>DNS 캐시 지우기 · 보기</td></tr>
<tr><td><code>ping</code></td><td>Packet INternet Groper</td><td>상대가 응답하는지 확인 (ICMP)</td></tr>
<tr><td><code>ping -t</code> · <code>-n 10</code> · <code>-l 1000</code></td><td></td><td>멈출 때까지 계속 · 10번만 · 1000바이트로</td></tr>
<tr><td><code>tracert</code></td><td>trace route</td><td>목적지까지 거치는 라우터 경로</td></tr>
<tr><td><code>pathping</code></td><td></td><td>tracert + 구간별 손실률</td></tr>
<tr><td><code>netstat -an</code></td><td>network statistics</td><td>모든 연결·열린 포트를 숫자로 (-a 전부, -n 숫자)</td></tr>
<tr><td><code>netstat -r</code> / <code>route print</code></td><td></td><td>라우팅 테이블 보기</td></tr>
<tr><td><code>nslookup</code></td><td>name server lookup</td><td>도메인 → IP 조회 (DNS 확인)</td></tr>
<tr><td><code>arp -a</code> · <code>arp -d</code></td><td>Address Resolution Protocol</td><td>IP↔MAC 캐시 보기 · 지우기</td></tr>
<tr><td><code>nbtstat</code></td><td>NetBIOS over TCP/IP statistics</td><td>NetBIOS 이름 정보</td></tr>
<tr><td><code>getmac</code> · <code>hostname</code></td><td></td><td>MAC 주소 · 컴퓨터 이름</td></tr>
<tr><td><code>net user</code> · <code>net share</code> · <code>net use</code></td><td></td><td>사용자 계정 · 공유 폴더 · 네트워크 드라이브 연결</td></tr>
</tbody></table></div>

<h2>시스템·디스크 명령</h2>
<div class="tbl"><table><thead><tr><th>명령</th><th>원래 말</th><th>뜻</th></tr></thead><tbody>
<tr><td><code>chkdsk /f</code> · <code>/r</code></td><td>check disk</td><td>디스크 오류 검사·수정 · 불량 섹터 찾기</td></tr>
<tr><td><code>sfc /scannow</code></td><td>System File Checker</td><td>윈도우 시스템 파일 검사·복구</td></tr>
<tr><td><code>convert c: /fs:ntfs</code></td><td></td><td>FAT32 → NTFS 변환 (데이터 유지)</td></tr>
<tr><td><code>format</code> · <code>diskpart</code></td><td></td><td>포맷 · 파티션 관리</td></tr>
<tr><td><code>defrag</code></td><td>defragment</td><td>조각 모음</td></tr>
<tr><td><code>systeminfo</code></td><td></td><td>OS·하드웨어 정보를 글자로</td></tr>
<tr><td><code>tasklist</code> · <code>taskkill /im 이름 /f</code></td><td></td><td>실행 중 프로그램 목록 · 강제 종료</td></tr>
<tr><td><code>shutdown /s /t 600</code> · <code>/r</code> · <code>/a</code></td><td></td><td>600초 뒤 끄기 · 다시 시작 · 예약 취소</td></tr>
<tr><td><code>attrib</code></td><td>attribute</td><td>파일 속성(읽기 전용·숨김 등) 바꾸기</td></tr>
<tr><td><code>bootrec /fixmbr</code> · <code>/fixboot</code></td><td></td><td>복구 환경에서 부트 영역 고치기</td></tr>
</tbody></table></div>

<h2>실행 창(Win+R)에 치는 관리 도구</h2>
<div class="tbl"><table><thead><tr><th>입력</th><th>열리는 도구</th></tr></thead><tbody>
<tr><td><code>msconfig</code></td><td>시스템 구성 (부팅 옵션·서비스)</td></tr>
<tr><td><code>regedit</code></td><td>레지스트리 편집기</td></tr>
<tr><td><code>devmgmt.msc</code></td><td>장치 관리자</td></tr>
<tr><td><code>diskmgmt.msc</code></td><td>디스크 관리</td></tr>
<tr><td><code>compmgmt.msc</code></td><td>컴퓨터 관리</td></tr>
<tr><td><code>services.msc</code></td><td>서비스</td></tr>
<tr><td><code>eventvwr.msc</code></td><td>이벤트 뷰어 (event viewer)</td></tr>
<tr><td><code>gpedit.msc</code></td><td>로컬 그룹 정책 편집기 (group policy editor)</td></tr>
<tr><td><code>msinfo32</code></td><td>시스템 정보</td></tr>
<tr><td><code>dxdiag</code></td><td>DirectX 진단 도구</td></tr>
<tr><td><code>mstsc</code></td><td>원격 데스크톱 연결 (Microsoft Terminal Services Client)</td></tr>
<tr><td><code>taskmgr</code> · <code>perfmon</code> · <code>resmon</code></td><td>작업 관리자 · 성능 모니터 · 리소스 모니터</td></tr>
<tr><td><code>ncpa.cpl</code> · <code>sysdm.cpl</code> · <code>appwiz.cpl</code></td><td>네트워크 연결 · 시스템 속성 · 프로그램 추가/제거</td></tr>
</tbody></table></div>
<p class="muted" style="font-size:13.5px">.msc = 관리 콘솔(MMC) 파일, .cpl = 제어판 항목 파일입니다.</p>
<div data-sg-widget="match" data-set="cmd"></div>`;

  const PC_WIN = `
<div class="callout"><b class="h">이 유형의 특징</b>가상 윈도우 화면에서 설정을 바꾸는 작업형입니다. 실기 강의 목차에 나오는 것: 네트워크 구성(IP·서브넷·DNS·게이트웨이), 레지스트리, 프린터·팩스, 원격 데스크톱, 폴더 권한. 에뮬레이터의 윈도우 버전은 다를 수 있으니 실습용 에뮬레이터로 확인하세요.</div>

<h2>네트워크 설정 (IP·DNS·게이트웨이)</h2>
<ol>
<li><kbd>Win</kbd>+<kbd>R</kbd> → <code>ncpa.cpl</code> → 이더넷(로컬 영역 연결) 우클릭 → <strong>속성</strong></li>
<li><strong>인터넷 프로토콜 버전 4(TCP/IPv4)</strong> → 속성 → "다음 IP 주소 사용"</li>
<li>IP 주소, 서브넷 마스크, 기본 게이트웨이, 기본 설정 DNS 서버, 보조 DNS 서버 입력 → 확인</li>
</ol>

<h2>원격 데스크톱 허용</h2>
<ol>
<li><kbd>Win</kbd>+<kbd>R</kbd> → <code>sysdm.cpl</code> (시스템 속성) → <strong>원격</strong> 탭</li>
<li><strong>이 컴퓨터에 대한 원격 연결 허용</strong> 선택 → [사용자 선택]으로 허용할 계정 추가 → 확인</li>
<li>접속하는 쪽은 <code>mstsc</code>(원격 데스크톱 연결) 실행. 포트는 <strong>3389</strong>.</li>
</ol>

<h2>폴더 공유와 권한</h2>
<ul>
<li><strong>공유</strong>: 폴더 우클릭 → 속성 → <strong>공유</strong> 탭 → <strong>고급 공유</strong> → "선택한 폴더 공유" → [권한]에서 Everyone 읽기/변경/모든 권한</li>
<li><strong>NTFS 권한</strong>: 폴더 속성 → <strong>보안</strong> 탭 → [편집] → [추가]로 사용자 넣기 → 허용/거부 체크</li>
<li>공유 권한과 NTFS 권한이 다르면 <strong>더 좁은(엄격한) 쪽</strong>이 적용됩니다. 거부가 허용보다 우선입니다.</li>
</ul>

<h2>가상 메모리</h2>
<p><code>sysdm.cpl</code> → <strong>고급</strong> 탭 → 성능 [설정] → <strong>고급</strong> 탭 → 가상 메모리 [변경] → "모든 드라이브에 대한 페이징 파일 크기 자동 관리" 해제 → 사용자 지정 크기 → [설정] → 확인</p>

<h2>프린터 공유</h2>
<p>설정(제어판) → 장치 및 프린터 → 프린터 우클릭 → <strong>프린터 속성</strong> → <strong>공유</strong> 탭 → "이 프린터 공유" 체크 → 공유 이름 입력</p>

<h2>레지스트리</h2>
<p><code>regedit</code>로 엽니다. 왼쪽은 <strong>키</strong>(폴더 모양), 오른쪽은 <strong>값</strong>(이름·종류·데이터)입니다. HKEY = handle to key.</p>
<div class="tbl"><table><thead><tr><th>루트 키</th><th>줄임</th><th>담긴 것</th></tr></thead><tbody>
<tr><td>HKEY_CLASSES_ROOT</td><td>HKCR</td><td>파일 확장자 연결(어떤 프로그램으로 열지), COM 정보</td></tr>
<tr><td>HKEY_CURRENT_USER</td><td>HKCU</td><td><strong>지금 로그온한 사용자</strong>의 설정 (바탕화면·제어판 등)</td></tr>
<tr><td>HKEY_LOCAL_MACHINE</td><td>HKLM</td><td><strong>컴퓨터 전체</strong>의 하드웨어·소프트웨어 설정</td></tr>
<tr><td>HKEY_USERS</td><td>HKU</td><td>모든 사용자 프로필 설정</td></tr>
<tr><td>HKEY_CURRENT_CONFIG</td><td>HKCC</td><td>지금 쓰는 하드웨어 프로필</td></tr>
</tbody></table></div>
<div class="tbl"><table><thead><tr><th>값 종류</th><th>뜻</th></tr></thead><tbody>
<tr><td>REG_SZ</td><td>문자열 (string)</td></tr>
<tr><td>REG_EXPAND_SZ</td><td>%SystemRoot% 같은 변수가 들어간 문자열</td></tr>
<tr><td>REG_MULTI_SZ</td><td>여러 줄 문자열</td></tr>
<tr><td>REG_DWORD</td><td>32비트 숫자 (double word)</td></tr>
<tr><td>REG_QWORD</td><td>64비트 숫자 (quad word)</td></tr>
<tr><td>REG_BINARY</td><td>2진 데이터</td></tr>
</tbody></table></div>
<ul>
<li><strong>키 만들기</strong>: 부모 키 우클릭 → <strong>새로 만들기 → 키</strong> → 이름 입력</li>
<li><strong>값 만들기</strong>: 오른쪽 빈 곳 우클릭 → 새로 만들기 → 문자열 값 / DWORD(32비트) 값 → 이름 → 더블클릭해 데이터 입력</li>
<li><strong>시작 프로그램</strong>: <code>HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run</code>(모든 사용자), <code>HKCU\\…\\Run</code>(현재 사용자)</li>
<li><strong>백업</strong>: 파일 → <strong>내보내기</strong>(.reg) · 복원: 파일 → 가져오기</li>
</ul>
<div data-sg-widget="match" data-set="reg"></div>`;

  const PC_DRAG = `
<div class="callout"><b class="h">이 유형의 특징</b>드래그 앤 드롭으로 <strong>부품 이름·규격을 제자리에</strong> 놓는 문제입니다. 강의 목차: 메인보드 칩셋, 기억장치, CPU·전원 연결·그래픽카드·백패널 구조. 아래 짝 맞추기로 연습하세요.</div>

<h2>메인보드 부품</h2>
<div class="tbl"><table><thead><tr><th>부품</th><th>설명</th></tr></thead><tbody>
<tr><td>CPU 소켓</td><td>CPU를 꽂는 자리 (인텔 LGA, AMD AM 계열)</td></tr>
<tr><td>DIMM 슬롯</td><td>메모리(RAM)를 꽂는 긴 슬롯</td></tr>
<tr><td>칩셋 (노스브리지)</td><td>CPU·메모리·그래픽처럼 <strong>빠른</strong> 장치 연결 (요즘은 CPU 안으로 들어감)</td></tr>
<tr><td>칩셋 (사우스브리지 / PCH)</td><td>SATA·USB·오디오·BIOS처럼 <strong>느린</strong> 입출력 장치 연결</td></tr>
<tr><td>PCIe x16 슬롯</td><td>그래픽카드</td></tr>
<tr><td>M.2 슬롯</td><td>NVMe SSD (PCIe 신호) 또는 SATA M.2</td></tr>
<tr><td>SATA 포트</td><td>HDD·SATA SSD·광학 드라이브 (SATA3 = 6Gbps)</td></tr>
<tr><td>24핀 ATX 커넥터</td><td>메인보드 주 전원</td></tr>
<tr><td>4/8핀 ATX12V(EPS) 커넥터</td><td>CPU 보조 전원</td></tr>
<tr><td>CMOS 배터리 (CR2032)</td><td>전원이 꺼져도 BIOS 설정·시계를 유지</td></tr>
<tr><td>BIOS(UEFI) 칩</td><td>펌웨어가 들어 있는 ROM</td></tr>
<tr><td>F_PANEL 핀</td><td>케이스 전원 버튼·리셋·LED 선 연결</td></tr>
</tbody></table></div>
<div data-sg-widget="match" data-set="board"></div>

<h2>메모리 규격과 핀 수</h2>
<div class="tbl"><table><thead><tr><th>규격</th><th>데스크톱 DIMM</th><th>노트북 SO-DIMM</th></tr></thead><tbody>
<tr><td>SDRAM</td><td>168핀</td><td>144핀</td></tr>
<tr><td>DDR</td><td>184핀</td><td>200핀</td></tr>
<tr><td>DDR2</td><td>240핀</td><td>200핀</td></tr>
<tr><td>DDR3</td><td>240핀</td><td>204핀</td></tr>
<tr><td>DDR4</td><td>288핀</td><td>260핀</td></tr>
<tr><td>DDR5</td><td>288핀</td><td>262핀</td></tr>
</tbody></table></div>
<div class="callout trap"><b class="h">함정</b>DDR2와 DDR3는 핀 수가 같아도(240) <strong>홈(노치) 위치가 달라</strong> 서로 꽂히지 않습니다. DDR4와 DDR5도 같은 288핀이지만 호환되지 않습니다.</div>
<div data-sg-widget="match" data-set="mem"></div>

<h2>백패널 포트와 색</h2>
<div class="tbl"><table><thead><tr><th>포트</th><th>색·특징</th></tr></thead><tbody>
<tr><td>PS/2 키보드 / 마우스</td><td><strong>보라색</strong> / <strong>초록색</strong></td></tr>
<tr><td>오디오 라인 출력 (스피커)</td><td><strong>연두색</strong></td></tr>
<tr><td>마이크 입력</td><td><strong>분홍색</strong></td></tr>
<tr><td>라인 입력</td><td><strong>하늘색</strong></td></tr>
<tr><td>VGA (D-Sub)</td><td>파란색, 15핀 아날로그 영상</td></tr>
<tr><td>DVI</td><td>흰색, 디지털(+아날로그) 영상</td></tr>
<tr><td>HDMI / DisplayPort</td><td>영상+소리 디지털</td></tr>
<tr><td>RJ45</td><td>유선 LAN</td></tr>
<tr><td>USB 3.x</td><td>보통 <strong>파란색</strong> 단자</td></tr>
</tbody></table></div>
<div data-sg-widget="match" data-set="jack"></div>`;

  // ───────── 짝 맞추기 자료 ─────────
  const MATCH = {
    ports: { title: '포트 번호 ↔ 프로토콜', pairs: [['21', 'FTP'], ['22', 'SSH'], ['23', 'Telnet'], ['25', 'SMTP'], ['53', 'DNS'], ['67/68', 'DHCP'], ['69', 'TFTP'], ['80', 'HTTP'], ['110', 'POP3'], ['123', 'NTP'], ['143', 'IMAP'], ['161', 'SNMP'], ['443', 'HTTPS'], ['3389', 'RDP']] },
    osi: { title: 'OSI 계층 ↔ 장비·프로토콜', pairs: [['1 물리 계층', '허브·리피터'], ['2 데이터링크 계층', '스위치·브리지·MAC'], ['3 네트워크 계층', '라우터·IP·ICMP'], ['4 전송 계층', 'TCP·UDP'], ['5 세션 계층', '연결 설정·동기화'], ['6 표현 계층', '암호화·압축·코드 변환'], ['7 응용 계층', 'HTTP·FTP·SMTP']] },
    icmp: { title: 'ICMP 타입 ↔ 뜻', pairs: [['0', 'Echo Reply'], ['3', 'Destination Unreachable'], ['4', 'Source Quench'], ['5', 'Redirect'], ['8', 'Echo Request'], ['11', 'Time Exceeded']] },
    rcmd: { title: '라우터 명령 ↔ 뜻', pairs: [['no shutdown', '포트 활성화'], ['copy r s', '설정 저장'], ['line vty 0 4', 'Telnet 설정'], ['line console 0', '콘솔 설정'], ['clock rate 72000', '클럭 72k'], ['bandwidth 2048', '대역폭 2048kbps'], ['exec-timeout 3 50', '3분 50초 후 자동 종료'], ['show ip route', '라우팅 테이블 보기'], ['ip dhcp pool icqa', 'DHCP 풀 만들기'], ['transport input ssh', 'SSH만 허용']] },
    linux: { title: '리눅스 명령 ↔ 뜻', pairs: [['passwd', '비밀번호 변경'], ['top', '실시간 프로세스 보기'], ['netstat', '라우팅·연결 상태'], ['traceroute', '경로 추적'], ['chmod', '권한 변경'], ['chown', '소유자 변경'], ['grub', '부트로더'], ['init', 'PID 1 첫 프로세스'], ['/etc/fstab', '자동 마운트 목록'], ['/etc/passwd', '사용자 계정 정보'], ['/etc/resolv.conf', 'DNS 서버 설정'], ['df', '디스크 남은 공간']] },
    bios: { title: 'BIOS 메뉴 ↔ 하는 일', pairs: [['Standard CMOS Features', '날짜·시간'], ['Advanced BIOS Features', '부팅 순서'], ['Integrated Peripherals', '온보드 LAN·사운드·USB'], ['Power Management Setup', '절전·Wake on LAN'], ['PC Health Status', 'CPU 온도·팬 속도'], ['Frequency/Voltage Control', '클럭·전압(오버클럭)'], ['Load Optimized Defaults', '최적 기본값'], ['Set Supervisor Password', '관리자 암호']] },
    cmd: { title: '명령 ↔ 하는 일', pairs: [['ipconfig /all', 'MAC·DNS까지 전체 보기'], ['ipconfig /flushdns', 'DNS 캐시 지우기'], ['ping -t', '멈출 때까지 ping'], ['tracert', '경로 추적'], ['netstat -an', '연결·포트를 숫자로'], ['arp -a', 'IP↔MAC 캐시 보기'], ['nslookup', '도메인 → IP 조회'], ['chkdsk /f', '디스크 오류 수정'], ['sfc /scannow', '시스템 파일 검사'], ['msconfig', '시스템 구성'], ['devmgmt.msc', '장치 관리자'], ['mstsc', '원격 데스크톱 연결'], ['dxdiag', 'DirectX 진단'], ['eventvwr.msc', '이벤트 뷰어']] },
    reg: { title: '레지스트리 ↔ 뜻', pairs: [['HKEY_CLASSES_ROOT', '파일 확장자 연결'], ['HKEY_CURRENT_USER', '지금 로그온한 사용자 설정'], ['HKEY_LOCAL_MACHINE', '컴퓨터 전체 설정'], ['HKEY_USERS', '모든 사용자 프로필'], ['HKEY_CURRENT_CONFIG', '현재 하드웨어 프로필'], ['REG_SZ', '문자열'], ['REG_DWORD', '32비트 숫자'], ['REG_QWORD', '64비트 숫자'], ['REG_BINARY', '2진 데이터']] },
    board: { title: '메인보드 부품 ↔ 설명', pairs: [['PCIe x16', '그래픽카드 슬롯'], ['DIMM', '메모리 슬롯'], ['M.2', 'NVMe SSD 슬롯'], ['SATA', 'HDD·SSD 연결 포트'], ['24핀 ATX', '메인보드 주 전원'], ['4/8핀 ATX12V', 'CPU 보조 전원'], ['CR2032', 'CMOS 배터리'], ['노스브리지', 'CPU·메모리 고속 연결'], ['사우스브리지', 'USB·SATA 저속 입출력'], ['F_PANEL', '전원 버튼·LED 선']] },
    mem: { title: '메모리 규격 ↔ 핀 수', pairs: [['SDRAM DIMM', '168핀'], ['DDR DIMM', '184핀'], ['DDR3 DIMM', '240핀'], ['DDR4 DIMM', '288핀'], ['DDR4 SO-DIMM', '260핀'], ['DDR5 SO-DIMM', '262핀'], ['DDR3 SO-DIMM', '204핀']] },
    jack: { title: '단자 색 ↔ 용도', pairs: [['보라색 PS/2', '키보드'], ['초록색 PS/2', '마우스'], ['연두색 오디오', '스피커(라인 출력)'], ['분홍색 오디오', '마이크'], ['하늘색 오디오', '라인 입력'], ['파란색 15핀', 'VGA(D-Sub)']] },
  };

  // ───────── 실전 문제 ─────────
  // type: input(직접 입력) · choice(하나) · multi(여러 개)
  // a: input이면 정답 목록, choice면 정답 번호(0부터), multi면 정답 번호 배열
  // router:true면 줄임말을 풀어서 비교합니다. cs:true면 대소문자를 구분합니다.
  const NET_DRILL = [
    // 라우터
    { id: 'r01', c: 'router', type: 'input', router: true, q: '사용자 모드(Router>)에서 특권(관리자) 모드로 들어가는 명령은?', a: ['enable'], e: '`en` = **en**able. 프롬프트가 `>`에서 `#`으로 바뀝니다. 저장(copy r s)과 show 확인은 이 모드에서 합니다.' },
    { id: 'r02', c: 'router', type: 'input', router: true, q: '특권 모드(Router#)에서 전역 설정 모드로 들어가는 명령은?', a: ['configure terminal'], e: '`conf t` = **conf**igure **t**erminal. 프롬프트가 `Router(config)#`로 바뀝니다.' },
    { id: 'r03', c: 'router', type: 'input', router: true, q: '지금 설정(running-config)을 저장(startup-config)하는 명령은? (특권 모드)', a: ['copy running-config startup-config', 'write memory'], e: '`copy r s` = copy **r**unning-config **s**tartup-config. 실행하면 `Destination filename [startup-config]?`가 나오는데, **Enter를 한 번 더** 눌러야 저장됩니다. `write memory`(wr)도 같은 일을 합니다.' },
    { id: 'r04', c: 'router', type: 'input', router: true, q: '인터페이스 모드에서 포트를 활성화(켜기)하는 명령은?', a: ['no shutdown'], e: '라우터 포트는 처음에 꺼져(shutdown) 있습니다. `no shutdown`(no shut)으로 켭니다. 지시문에 **활성화**라는 말이 있을 때만 넣습니다.' },
    { id: 'r05', c: 'router', type: 'input', router: true, q: '전역 설정 모드에서 FastEthernet 0/0 인터페이스로 들어가는 명령은?', a: ['interface fastethernet 0/0'], e: '`int fa0/0`처럼 줄여도 됩니다. 프롬프트가 `Router(config-if)#`로 바뀝니다.' },
    { id: 'r06', c: 'router', type: 'input', router: true, q: '인터페이스에 IP 192.168.0.100, 서브넷 /24를 설정하는 명령은?', a: ['ip address 192.168.0.100 255.255.255.0'], e: '`ip address IP 마스크`. /24는 **255.255.255.0**으로 씁니다. 라우터는 /24 같은 접두사 표기를 받지 않습니다.' },
    { id: 'r07', c: 'router', type: 'input', router: true, q: '같은 인터페이스에 보조 IP 192.168.0.102/24를 추가하는 명령은?', a: ['ip address 192.168.0.102 255.255.255.0 secondary'], e: '두 번째 IP는 끝에 **secondary**를 붙입니다. 안 붙이면 첫 번째 IP가 **바뀌어** 버립니다.' },
    { id: 'r08', c: 'router', type: 'input', router: true, q: 'Serial 2/0의 클럭 속도를 72k로 설정하는 명령은? (인터페이스 모드)', a: ['clock rate 72000'], e: 'clock rate의 단위는 **bps**입니다. 72k = **72000**. "72k"라고 치면 오류입니다. 클럭은 DCE(Data Communications Equipment, 신호를 만들어 주는 쪽) 시리얼 포트에 설정합니다.' },
    { id: 'r09', c: 'router', type: 'input', router: true, q: 'Serial 2/0의 대역폭을 2048로 설정하는 명령은?', a: ['bandwidth 2048'], e: 'bandwidth의 단위는 **kbps**입니다. 2048 = 2048kbps(약 2Mbps).' },
    { id: 'r10', c: 'router', type: 'input', router: true, cs: true, q: 'FastEthernet 0/0의 설명(주석)을 ICQA로 설정하는 명령은? (대소문자 구분)', a: ['description ICQA'], e: '`desc ICQA`로 줄여도 됩니다. 설명 글자는 **대소문자 그대로** 저장됩니다.' },
    { id: 'r11', c: 'router', type: 'input', router: true, q: 'Telnet 접속 설정 모드로 들어가는 명령은? (전역 설정 모드)', a: ['line vty 0 4'], e: 'vty = virtual teletype(가상 터미널). Telnet·SSH 같은 원격 접속은 **line vty 0 4**에서 설정합니다. 0 4는 동시 접속 줄 5개(0~4)를 뜻합니다.' },
    { id: 'r12', c: 'router', type: 'input', router: true, q: '콘솔 접속 설정 모드로 들어가는 명령은?', a: ['line console 0'], e: '`line con 0`. 콘솔 케이블로 직접 연결하는 줄입니다.' },
    { id: 'r13', c: 'router', type: 'input', router: true, q: '라인 모드에서 접속할 때 비밀번호를 묻게 하는 명령은? (비밀번호를 정한 다음에 치는 것)', a: ['login'], e: '`password 비밀번호`로 정하고 **login**을 쳐야 실제로 비밀번호를 물어봅니다. 지시문의 "로그인 설정"이 바로 이 명령입니다.' },
    { id: 'r14', c: 'router', type: 'input', router: true, q: 'Telnet 세션이 3분 50초 동안 입력이 없으면 자동 종료되게 하는 명령은? (라인 모드)', a: ['exec-timeout 3 50'], e: '`exec-timeout 분 초` 순서입니다. 3분 50초 → `exec-timeout 3 50`.' },
    { id: 'r15', c: 'router', type: 'input', router: true, cs: true, q: '라우터의 호스트 이름을 network2로 바꾸는 명령은? (전역 설정 모드)', a: ['hostname network2'], e: '바꾸면 프롬프트가 바로 `network2(config)#`로 바뀝니다.' },
    { id: 'r16', c: 'router', type: 'input', router: true, q: '기본 게이트웨이를 192.168.0.10으로 설정하는 명령은? (전역 설정 모드)', a: ['ip default-gateway 192.168.0.10'], e: '`ip default-gateway 주소`. 비슷한 `ip default-network`는 기본 네트워크를 정하는 다른 명령입니다.' },
    { id: 'r17', c: 'router', type: 'input', router: true, q: 'DHCP 풀(서버 이름) icqa를 만드는 명령은? (전역 설정 모드)', a: ['ip dhcp pool icqa'], e: '풀을 먼저 만들면 `Router(dhcp-config)#`로 들어가고, 그 안에서 `network`로 대역을 정합니다.' },
    { id: 'r18', c: 'router', type: 'input', router: true, q: 'DHCP 풀 안에서 네트워크 192.168.100.0/24를 지정하는 명령은?', a: ['network 192.168.100.0 255.255.255.0'], e: '`network 네트워크주소 마스크`.' },
    { id: 'r19', c: 'router', type: 'input', router: true, q: '라우팅 테이블을 확인하는 명령은?', a: ['show ip route'], e: '특권 모드에서 `sh ip route`. 지시문이 "확인 후 저장"이면 다음에 copy r s.' },
    { id: 'r20', c: 'router', type: 'input', router: true, q: '플래시 메모리 내용을 확인하는 명령은?', a: ['show flash'], e: '플래시 = IOS(Internetwork Operating System) 파일이 들어 있는 메모리.' },
    { id: 'r21', c: 'router', type: 'input', router: true, q: '라우터에 접속한 사용자 정보를 확인하는 명령은?', a: ['show users'], e: '`show user`로 쳐도 같은 명령으로 인식됩니다.' },
    { id: 'r22', c: 'router', type: 'input', router: true, q: 'Serial 인터페이스를 프레임 릴레이 방식으로 캡슐화하는 명령은?', a: ['encapsulation frame-relay'], e: '`encapsulation 방식`. 시리얼 포트 기본값은 HDLC입니다. 다른 방식: ppp.' },
    { id: 'r23', c: 'router', type: 'input', router: true, cs: true, q: 'SNMP 커뮤니티 이름을 ICQA, 읽기 전용으로 설정하는 명령은?', a: ['snmp-server community ICQA ro'], e: 'SNMP = Simple Network Management Protocol. ro = read-only(읽기 전용), rw = read-write.' },
    { id: 'r24', c: 'router', type: 'input', router: true, q: 'Telnet 대신 SSH로만 원격 접속하게 하는 명령은? (line vty 안에서)', a: ['transport input ssh'], e: 'transport input = 이 줄로 들어올 수 있는 접속 방식. ssh만 허용하면 Telnet은 막힙니다.' },
    { id: 'r25', c: 'router', type: 'input', router: true, q: '목적지 192.168.20.0/24를 다음 홉 192.168.0.1로 보내는 정적 경로 명령은?', a: ['ip route 192.168.20.0 255.255.255.0 192.168.0.1'], e: '`ip route 목적지 마스크 다음홉`.' },
    { id: 'r26', c: 'router', type: 'choice', q: '프롬프트가 Router(config-if)# 일 때 지금 모드는?', o: ['사용자 모드', '특권 모드', '전역 설정 모드', '인터페이스 설정 모드'], a: 3, e: 'if = interface. `interface ...` 명령으로 들어온 상태입니다. 여기서 IP·활성화·클럭·대역폭을 설정합니다.' },
    { id: 'r27', c: 'router', type: 'choice', q: 'clock rate와 bandwidth의 단위로 옳은 것은?', o: ['둘 다 bps', 'clock rate = bps, bandwidth = kbps', 'clock rate = kbps, bandwidth = bps', '둘 다 kbps'], a: 1, e: 'clock rate 72000 = 72,000bps(72k). bandwidth 2048 = 2,048kbps. 단위가 다르다는 것이 함정입니다.' },
    // 리눅스
    { id: 'l01', c: 'linux', type: 'input', q: '리눅스에서 사용자 비밀번호를 설정·변경하는 명령은?', a: ['passwd'], e: 'passwd = password. 철자에 o와 r이 없습니다.' },
    { id: 'l02', c: 'linux', type: 'input', q: 'CPU 사용률과 프로세스를 실시간으로 보여 주는 리눅스 명령은?', a: ['top'], e: 'top은 화면이 계속 바뀌며 실시간으로 보여 줍니다. `ps`는 한 번만 보여 줍니다.' },
    { id: 'l03', c: 'linux', type: 'input', q: '라우팅 테이블, 네트워크 인터페이스, 네트워크 연결 상태를 보여 주는 리눅스 명령은?', a: ['netstat'], e: 'netstat = network statistics. -r 라우팅 테이블, -i 인터페이스, -a 모든 연결.' },
    { id: 'l04', c: 'linux', type: 'input', q: '목적지 서버까지 가는 네트워크 경로를 보여 주는 리눅스 명령은?', a: ['traceroute'], e: '리눅스 = **traceroute**(기본 UDP), 윈도우 = **tracert**(ICMP). 운영체제를 꼭 확인하세요.' },
    { id: 'l05', c: 'linux', type: 'input', cs: true, q: 'ICQA 파일을 소유자는 모든 권한, 그룹과 기타 사용자는 읽기·실행만 되게 바꾸는 명령은?', a: ['chmod 755 ICQA'], e: '소유자 rwx = 4+2+1 = 7, 그룹 r-x = 4+1 = 5, 기타 r-x = 5 → **755**.' },
    { id: 'l06', c: 'linux', type: 'input', q: '리눅스의 대표 부트로더 이름은?', a: ['grub', 'grub2'], e: 'GRUB = GRand Unified Bootloader. 예전에는 LILO도 있었습니다.' },
    { id: 'l07', c: 'linux', type: 'input', q: '리눅스 커널이 부팅을 마친 뒤 처음 실행하는 프로세스(PID 1)는? (전통적인 이름)', a: ['init', 'systemd'], e: '기출 정답은 **init**입니다. 요즘 배포판은 systemd가 PID 1을 맡습니다. `init 0` = 종료, `init 6` = 재부팅.' },
    { id: 'l08', c: 'linux', type: 'input', q: '부팅할 때 자동으로 마운트할 파일 시스템을 적어 두는 파일은? (전체 경로)', a: ['/etc/fstab'], e: 'fstab = file system table.' },
    { id: 'l09', c: 'linux', type: 'choice', q: '리눅스를 종료하는 init 명령은?', o: ['init 0', 'init 1', 'init 3', 'init 6'], a: 0, e: '런레벨 0 = 종료, 1 = 단일 사용자, 3 = 텍스트 다중 사용자, 5 = 그래픽, 6 = 재부팅.' },
    { id: 'l10', c: 'linux', type: 'input', q: '사용자 계정 정보가 들어 있는 파일은? (전체 경로)', a: ['/etc/passwd'], e: '암호(해시)는 따로 **/etc/shadow**에 들어 있습니다.' },
    { id: 'l11', c: 'linux', type: 'input', q: 'DNS 서버 주소를 설정하는 파일은? (전체 경로)', a: ['/etc/resolv.conf'], e: 'resolv.conf의 nameserver 줄에 DNS 서버 IP를 적습니다. 이름↔IP를 직접 적는 파일은 /etc/hosts.' },
    { id: 'l12', c: 'linux', type: 'input', q: '파일의 소유자를 바꾸는 리눅스 명령은?', a: ['chown'], e: 'chown = change owner. 권한은 chmod, 그룹은 chgrp.' },
    { id: 'l13', c: 'linux', type: 'choice', q: 'ping(ICMP echo)에 응답하도록 하는 명령은?', o: ['echo 1 > /proc/sys/net/ipv4/icmp_echo_ignore_all', 'echo 0 > /proc/sys/net/ipv4/icmp_echo_ignore_all', 'echo 0 > /etc/hosts', 'ping -allow'], a: 1, e: 'icmp_echo_ignore_all = "에코를 모두 무시". **0이면 응답**, 1이면 무시합니다.' },
    { id: 'l14', c: 'linux', type: 'choice', q: '권한 640의 뜻은?', o: ['rw-r-----', 'rwxr-----', 'rw-rw----', 'r--r-----'], a: 0, e: '6 = rw-(4+2), 4 = r--, 0 = ---. 소유자 읽기·쓰기, 그룹 읽기, 기타 없음.' },
    // 단답형
    { id: 's01', c: 'short', type: 'input', q: '스위치에서 물리적 위치와 상관없이 논리적으로 LAN을 나누는 기술은?', a: ['vlan', 'virtual lan'], e: 'VLAN = Virtual LAN. 브로드캐스트 영역을 나눕니다.' },
    { id: 's02', c: 'short', type: 'input', q: '스위치끼리 VLAN 정보를 자동으로 동기화하는 프로토콜은?', a: ['vtp'], e: 'VTP = VLAN Trunking Protocol.' },
    { id: 's03', c: 'short', type: 'input', q: '링크 상태 방식으로 최단 경로를 계산하는 라우팅 프로토콜은?', a: ['ospf'], e: 'OSPF = Open Shortest Path First. 다익스트라 알고리즘을 씁니다.' },
    { id: 's04', c: 'short', type: 'input', q: '거리 벡터 방식, 최대 홉 15, 30초마다 업데이트하는 라우팅 프로토콜은?', a: ['rip'], e: 'RIP = Routing Information Protocol. 16홉이면 도달 불가로 봅니다.' },
    { id: 's05', c: 'short', type: 'multi', q: '네트워크 계층 프로토콜을 모두 고르세요.', o: ['ICMP', 'IGMP', 'ARP', 'TCP', 'UDP', 'HTTP'], a: [0, 1, 2], e: 'ICMP·IGMP·ARP(·RARP·IP)는 네트워크 계층. TCP·UDP는 전송 계층, HTTP는 응용 계층입니다. (ARP를 2계층으로 보는 책도 있지만 기출 정답은 네트워크 계층입니다.)' },
    { id: 's06', c: 'short', type: 'choice', q: '코드 변환, 암호화, 압축을 담당하는 OSI 계층은?', o: ['세션 계층', '표현 계층', '응용 계층', '전송 계층'], a: 1, e: '6계층 표현(Presentation) 계층. 데이터 모양을 바꾸는 계층이라고 외우세요.' },
    { id: 's07', c: 'short', type: 'input', q: '호스트 192.168.1.10, 서브넷 마스크 255.255.255.240일 때 네트워크 주소는?', a: ['192.168.1.0'], e: '마스크 240 → 블록 크기 16(0, 16, 32 …). 10은 0~15 블록에 들어가므로 네트워크 주소는 **192.168.1.0**, 브로드캐스트는 192.168.1.15.' },
    { id: 's08', c: 'short', type: 'input', q: 'IPSec에서 인증과 무결성만 제공하고 암호화는 하지 않는 프로토콜은?', a: ['ah'], e: 'AH = Authentication Header. 암호화까지 하는 것은 **ESP**(Encapsulating Security Payload).' },
    { id: 's09', c: 'short', type: 'input', q: '디스크 2개에 같은 데이터를 똑같이 쓰는(미러링) RAID 레벨은? (예: RAID 0)', a: ['raid 1', 'raid1', '1'], e: 'RAID 0 = 스트라이핑(나눠 쓰기), RAID 1 = 미러링, RAID 5 = 패리티 분산.' },
    { id: 's10', c: 'short', type: 'input', q: '화면(그래픽) 정보를 저장하는 전용 메모리는?', a: ['vram', 'video ram'], e: 'VRAM = Video RAM.' },
    { id: 's11', c: 'short', type: 'input', q: '웹(HTTP) 트래픽을 분석해 웹 공격을 막는 방화벽은? (영문 약자)', a: ['waf', '웹 방화벽', '웹방화벽'], e: 'WAF = Web Application Firewall.' },
    { id: 's12', c: 'short', type: 'input', q: '원격 로그인·명령 실행·파일 복사를 암호화해서 하는 프로토콜은?', a: ['ssh'], e: 'SSH = Secure Shell, 포트 22. 암호화하지 않는 옛 방식은 Telnet(23).' },
    { id: 's13', c: 'short', type: 'choice', q: 'ICMP 타입 8의 뜻은?', o: ['Echo Reply', 'Destination Unreachable', 'Echo Request', 'Time Exceeded'], a: 2, e: '8 = Echo Request(ping 보냄), 0 = Echo Reply(ping 응답), 3 = 도달 불가, 11 = 시간 초과(TTL 0).' },
    { id: 's14', c: 'short', type: 'input', q: 'HTTPS의 기본 포트 번호는?', a: ['443'], e: 'HTTP 80, HTTPS 443.' },
    { id: 's15', c: 'short', type: 'input', q: 'DNS의 기본 포트 번호는?', a: ['53'], e: 'DNS = 53 (UDP·TCP).' },
    { id: 's16', c: 'short', type: 'input', q: '원격 데스크톱(RDP)의 기본 포트 번호는?', a: ['3389'], e: 'RDP = Remote Desktop Protocol, 3389.' },
    { id: 's17', c: 'short', type: 'multi', q: 'UDP의 특징을 모두 고르세요.', o: ['비연결형이다', 'TCP보다 빠르다', '혼잡 제어를 한다', '3-way handshake로 연결한다', '헤더가 TCP보다 단순하다'], a: [0, 1, 4], e: 'UDP는 연결 과정과 흐름·혼잡 제어가 없어서 빠르고 헤더가 8바이트로 단순합니다. 혼잡 제어·3-way handshake는 TCP 특징입니다.' },
    { id: 's18', c: 'short', type: 'input', q: 'IPv6 주소는 몇 비트인가요? (숫자만)', a: ['128'], e: 'IPv4 = 32비트, IPv6 = 128비트(16진수 4자리 × 8블록).' },
    { id: 's19', c: 'short', type: 'choice', q: '사설 IP 대역이 아닌 것은?', o: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '172.32.0.0/16'], a: 3, e: '사설 IP: 10.0.0.0~10.255.255.255, 172.16.0.0~172.31.255.255, 192.168.0.0~192.168.255.255. 172.32는 범위 밖입니다.' },
    { id: 's20', c: 'short', type: 'choice', q: 'NGFW(Next-Generation Firewall)에 대한 설명으로 가장 알맞은 것은?', o: ['IP와 포트만 보고 막는다', '애플리케이션을 구분하고 침입 방지(IPS) 기능을 합쳤다', 'MAC 주소만 보고 막는다', '무선 신호를 암호화하는 장비이다'], a: 1, e: 'NGFW = 차세대 방화벽. 기존 방화벽(IP·포트)에 애플리케이션 식별, IPS, 사용자 식별 등을 더한 장비입니다.' },
    // 윈도우 서버
    { id: 'w01', c: 'win', type: 'input', q: '2진수 IP 10101100.00010000.10010110.01110011 을 10진수로 쓰면?', a: ['172.16.150.115'], e: '10101100 = 128+32+8+4 = 172, 00010000 = 16, 10010110 = 128+16+4+2 = 150, 01110011 = 64+32+16+2+1 = 115.' },
    { id: 'w02', c: 'win', type: 'input', q: '22비트 서브넷 마스크를 10진수로 쓰면?', a: ['255.255.252.0'], e: '1이 22개 = 8 + 8 + 6. 셋째 옥텟 11111100 = 252 → 255.255.252.0.' },
    { id: 'w03', c: 'win', type: 'input', q: '호스트가 6개 이상 필요한 가장 작은 서브넷은? (예: /24)', a: ['/29', '29', '255.255.255.248'], e: '호스트 비트 3개 → 2³ − 2 = 6개. 32 − 3 = **/29** = 255.255.255.248.' },
    { id: 'w04', c: 'win', type: 'choice', q: '"3번 로그인 실패하면 30분간 계정 잠금"을 설정하는 곳은?', o: ['암호 정책 → 최소 암호 길이 3, 최대 암호 사용 기간 30', '계정 잠금 정책 → 계정 잠금 임계값 3, 계정 잠금 기간 30', '감사 정책 → 로그온 실패 3', '사용자 권한 할당 → 로그온 거부'], a: 1, e: '로컬 보안 정책 → 계정 정책 → **계정 잠금 정책**. 임계값을 3으로 정하면 잠금 기간 창이 뜹니다.' },
    { id: 'w05', c: 'win', type: 'choice', q: '"패스워드를 최소 10일, 최대 20일 사용"을 설정하는 곳은?', o: ['계정 잠금 정책', '암호 정책의 최소·최대 암호 사용 기간', '사용자 속성의 암호 사용 기간 제한 없음', '그룹 정책의 로그온 시간'], a: 1, e: '로컬 보안 정책 → 계정 정책 → 암호 정책 → 최소 암호 사용 기간 10, 최대 암호 사용 기간 20.' },
    { id: 'w06', c: 'win', type: 'choice', q: 'Telnet 서비스를 중지하고 다시 시작할 수 없게 하려면?', o: ['[중지]만 누른다', '시작 유형 "수동"으로 바꾼다', '시작 유형 "사용 안 함"으로 바꾸고 [중지]', '서비스를 삭제한다'], a: 2, e: '"다시 시작할 수 없게" = 시작 유형 **사용 안 함**. 거기에 지금 멈추는 [중지]까지 해야 정답입니다.' },
    { id: 'w07', c: 'win', type: 'choice', q: 'DNS에서 ftp라는 이름이 www를 가리키게 하는 레코드는?', o: ['A', 'MX', 'CNAME', 'PTR'], a: 2, e: 'CNAME = Canonical Name(별칭). 별칭 이름 ftp, 대상 www.icqa.or.kr.' },
    { id: 'w08', c: 'win', type: 'choice', q: 'IIS에서 192.168.100.0/24 대역만 접속을 허용하는 방법은?', o: ['바인딩에 IP 추가', 'IP 주소 및 도메인 제한 → 허용 항목 추가 → 특정 IP 주소 192.168.100.0', 'IP 주소 및 도메인 제한 → 허용 항목 추가 → IP 주소 범위 192.168.100.0 / 255.255.255.0', '기본 문서에 IP 추가'], a: 2, e: '대역은 **IP 주소 범위**와 마스크로 넣습니다. 특정 IP로 넣으면 그 주소 하나만 허용됩니다.' },
    { id: 'w09', c: 'win', type: 'choice', q: '새 사용자를 만들 때 "암호를 변경할 수 없음"이 체크되지 않는다. 먼저 할 일은?', o: ['계정 사용 안 함 체크', '다음 로그온할 때 반드시 암호 변경 체크 해제', 'Administrators 그룹에 추가', '암호를 비운다'], a: 1, e: '"다음 로그온할 때 반드시 암호 변경"과 "암호를 변경할 수 없음"은 함께 켤 수 없습니다. 기본으로 켜져 있는 앞의 것을 먼저 끕니다.' },
    { id: 'w10', c: 'win', type: 'choice', q: 'DHCP에서 특정 PC가 항상 같은 IP를 받게 하는 기능은?', o: ['제외 범위', '임대 기간', '예약 (MAC 주소)', '범위 옵션'], a: 2, e: '범위 → 예약 → 새 예약 → IP 주소와 그 PC의 **MAC 주소**를 넣습니다.' },
    { id: 'w11', c: 'win', type: 'choice', q: 'SOA 레코드의 주 서버·책임자를 입력하는 방법으로 옳은 것은?', o: ['앞 이름만 쓴다(예: ns)', '전체 이름(FQDN)을 쓴다', 'IP 주소를 쓴다', '비워 둔다'], a: 1, e: '합격자 후기: 앞부분만 쓰면 틀립니다. ns.icqa.or.kr처럼 **전체 이름**으로 씁니다.' },
    { id: 'w12', c: 'win', type: 'choice', q: 'FTP 사이트의 동시 접속 수를 제한하는 곳은?', o: ['FTP 메시지', 'FTP 인증', '고급 설정 → 연결 → 최대 연결 수', '바인딩'], a: 2, e: '[FTP 메시지]는 "최대 연결 수를 넘었을 때 보여 줄 글"이고, 실제 숫자 제한은 **고급 설정의 최대 연결 수**입니다.' },
    { id: 'w13', c: 'win', type: 'choice', q: 'IP 주소 하나로 웹 사이트 2개를 운영하려면?', o: ['포트를 똑같이 둔다', '바인딩 편집 → 추가에서 호스트 이름을 다르게', '기본 문서를 2개 만든다', 'DHCP 예약을 만든다'], a: 1, e: '같은 IP·포트라도 **호스트 이름**(www.a.com / www.b.com)이 다르면 구분됩니다.' },
    { id: 'w14', c: 'win', type: 'choice', q: 'DHCP 새 범위 마법사의 "범위 활성화" 단계. 문제에 활성화 지시가 없다면?', o: ['예', '아니요', '상관없다', '마법사를 취소한다'], a: 1, e: '지시가 없는 항목은 바꾸지 않는 것이 원칙입니다. 활성화 지시가 있으면 예약까지 넣은 뒤 범위 우클릭 → 활성화.' },
  ];

  const CABLE_DRILL = [
    { id: 'c01', c: 'cable', type: 'choice', q: 'PC와 스위치를 연결하는 케이블은?', o: ['다이렉트', '크로스', '롤오버(콘솔)', '아무거나'], a: 0, e: 'PC(A 그룹, MDI) ↔ 스위치(B 그룹, MDI-X). **다른 그룹 = 다이렉트**.' },
    { id: 'c02', c: 'cable', type: 'choice', q: 'PC와 PC를 직접 연결하는 케이블은?', o: ['다이렉트', '크로스'], a: 1, e: '같은 A 그룹끼리 = **크로스**.' },
    { id: 'c03', c: 'cable', type: 'choice', q: '스위치와 스위치를 일반 포트로 연결하는 케이블은?', o: ['다이렉트', '크로스'], a: 1, e: '같은 B 그룹끼리 = 크로스.' },
    { id: 'c04', c: 'cable', type: 'choice', q: 'PC와 라우터를 직접 연결하는 케이블은?', o: ['다이렉트', '크로스'], a: 1, e: 'PC와 라우터는 둘 다 A 그룹(MDI)입니다. 같은 그룹 = **크로스**. 자주 틀리는 문제입니다.' },
    { id: 'c05', c: 'cable', type: 'choice', q: '라우터와 스위치를 연결하는 케이블은?', o: ['다이렉트', '크로스'], a: 0, e: '라우터(A) ↔ 스위치(B) = 다이렉트.' },
    { id: 'c06', c: 'cable', type: 'choice', q: 'T568B 배열에서 3번 선의 색은?', o: ['주황', '흰초록', '파랑', '흰파랑'], a: 1, e: 'T568B: 1 흰주, 2 주, **3 흰초**, 4 파, 5 흰파, 6 초, 7 흰갈, 8 갈.' },
    { id: 'c07', c: 'cable', type: 'choice', q: 'T568A 배열에서 1번 선의 색은?', o: ['흰주황', '흰초록', '흰파랑', '흰갈색'], a: 1, e: 'T568A: 1 흰초, 2 초, 3 흰주, 4 파, 5 흰파, 6 주, 7 흰갈, 8 갈. B에서 주황과 초록만 바뀝니다.' },
    { id: 'c08', c: 'cable', type: 'choice', q: '크로스 케이블을 만드는 방법은?', o: ['양쪽 다 T568B', '양쪽 다 T568A', '한쪽 T568B, 다른 쪽 T568A', '한쪽만 순서를 거꾸로'], a: 2, e: '한쪽은 B, 다른 쪽은 A. 주황 쌍과 초록 쌍의 자리가 서로 바뀝니다.' },
    { id: 'c09', c: 'cable', type: 'choice', q: '크로스 케이블을 테스터로 볼 때, MASTER 1번에 불이 들어오면 REMOTE는 몇 번이 켜지나요?', o: ['1번', '2번', '3번', '6번'], a: 2, e: '크로스: 1↔3, 2↔6. 4·5·7·8번은 같은 번호.' },
    { id: 'c10', c: 'cable', type: 'choice', q: 'RJ45 커넥터에서 1번 핀을 찾는 방법은?', o: ['클립을 위로 하고 왼쪽', '클립을 아래로(금속 핀이 위) 하고 왼쪽', '클립을 아래로 하고 오른쪽', '항상 흰색 선 쪽'], a: 1, e: '클립(걸쇠)을 아래로, 금색 핀이 보이게 들었을 때 **왼쪽이 1번**입니다.' },
    { id: 'c11', c: 'cable', type: 'choice', q: '심선을 자를 때 겉피복 끝에서 남기는 길이로 알맞은 것은?', o: ['약 0.5cm', '약 1.2~1.5cm', '약 3cm', '약 5cm'], a: 1, e: '약 1.2~1.5cm. 너무 길면 겉피복이 커넥터 안에 물리지 않아 쉽게 빠지고, 너무 짧으면 핀에 닿지 않습니다.' },
  ];

  const PC_DRILL = [
    // CMOS
    { id: 'b01', c: 'cmos', type: 'choice', q: 'Award BIOS에서 날짜와 시간을 바꾸는 메뉴는?', o: ['Standard CMOS Features', 'Advanced BIOS Features', 'Integrated Peripherals', 'Power Management Setup'], a: 0, e: '날짜·시간·드라이브 정보 = **Standard CMOS Features**.' },
    { id: 'b02', c: 'cmos', type: 'choice', q: '부팅 순서(First Boot Device)를 바꾸는 메뉴는?', o: ['Standard CMOS Features', 'Advanced BIOS Features', 'PnP/PCI Configurations', 'PC Health Status'], a: 1, e: '부팅 순서·Security Option·NumLock = **Advanced BIOS Features**.' },
    { id: 'b03', c: 'cmos', type: 'choice', q: '온보드 사운드·LAN·USB를 켜고 끄는 메뉴는?', o: ['Integrated Peripherals', 'Advanced Chipset Features', 'Frequency/Voltage Control', 'Load Optimized Defaults'], a: 0, e: '메인보드에 붙어 있는(통합된) 장치 = **Integrated Peripherals**.' },
    { id: 'b04', c: 'cmos', type: 'choice', q: '절전 기능, ACPI, Wake on LAN을 설정하는 메뉴는?', o: ['Standard CMOS Features', 'Power Management Setup', 'PnP/PCI Configurations', 'Advanced BIOS Features'], a: 1, e: '전원 관련 = **Power Management Setup**. (필기 2026년 1회 37번에도 출제)' },
    { id: 'b05', c: 'cmos', type: 'choice', q: 'CPU 온도와 팬 속도를 확인하는 메뉴는?', o: ['PC Health Status', 'Standard CMOS Features', 'Integrated Peripherals', 'Advanced Chipset Features'], a: 0, e: 'PC Health Status = 온도·팬·전압 확인.' },
    { id: 'b06', c: 'cmos', type: 'choice', q: 'Security Option을 System으로 하면?', o: ['BIOS 설정에 들어갈 때만 암호', '컴퓨터를 켤 때마다(부팅 시) 암호', '윈도우 로그인 암호', '암호를 쓰지 않음'], a: 1, e: 'Setup = 설정 화면에 들어갈 때만. **System = 부팅할 때마다**.' },
    { id: 'b07', c: 'cmos', type: 'input', q: 'Award BIOS에서 설정을 저장하고 나가는 키는? (예: F1)', a: ['f10'], e: 'F10 → Y. 저장하지 않고 나가려면 Exit Without Saving.' },
    { id: 'b08', c: 'cmos', type: 'choice', q: 'BIOS 설정이 자주 초기화되는 가장 흔한 원인은?', o: ['CMOS 배터리 방전', '그래픽카드 고장', '하드디스크 불량 섹터', '윈도우 업데이트'], a: 0, e: '설정과 시계는 CMOS 배터리(CR2032) 전기로 유지됩니다. 배터리가 다 되면 꺼질 때마다 초기화됩니다.' },
    { id: 'b09', c: 'cmos', type: 'choice', q: 'BIOS 암호를 잊었을 때 알맞은 조치는?', o: ['RAM을 다시 꽂는다', 'CMOS Clear 점퍼를 쇼트하거나 배터리를 잠시 뺀다', '하드디스크를 포맷한다', '윈도우를 다시 설치한다'], a: 1, e: 'CMOS 내용을 지우면 암호도 지워집니다. 그 뒤에는 설정을 다시 해야 합니다.' },
    { id: 'b10', c: 'cmos', type: 'choice', q: 'NCQ(Native Command Queuing)를 쓰려면 SATA 모드를 무엇으로 해야 하나요?', o: ['IDE', 'AHCI', 'Legacy', 'Disabled'], a: 1, e: 'AHCI = Advanced Host Controller Interface. NCQ·핫플러그를 쓰려면 AHCI.' },
    // 콘솔
    { id: 'k01', c: 'console', type: 'input', q: 'MAC 주소와 DNS 서버까지 IP 설정을 전부 보는 명령은?', a: ['ipconfig /all', 'ipconfig -all'], e: 'ipconfig = IP configuration. /all이 없으면 IP·마스크·게이트웨이만 보입니다.' },
    { id: 'k02', c: 'console', type: 'input', q: 'DNS 캐시를 지우는 명령은?', a: ['ipconfig /flushdns', 'ipconfig -flushdns'], e: 'flush = 비우다. 캐시를 보는 것은 /displaydns.' },
    { id: 'k03', c: 'console', type: 'input', q: 'DHCP로 받은 IP를 반납하는 명령은?', a: ['ipconfig /release', 'ipconfig -release'], e: '반납 /release, 다시 받기 /renew.' },
    { id: 'k04', c: 'console', type: 'input', q: '192.168.0.1에 멈출 때까지 계속 ping을 보내는 명령은?', a: ['ping -t 192.168.0.1', 'ping 192.168.0.1 -t', 'ping /t 192.168.0.1', 'ping 192.168.0.1 /t'], e: '-t = 계속. 멈추려면 Ctrl+C. 횟수 지정은 -n, 크기는 -l.' },
    { id: 'k05', c: 'console', type: 'input', q: '윈도우에서 목적지까지 거치는 라우터 경로를 보는 명령은?', a: ['tracert'], e: '윈도우 = tracert(ICMP), 리눅스 = traceroute(UDP).' },
    { id: 'k06', c: 'console', type: 'input', q: '모든 연결과 열린 포트를 숫자로 보여 주는 명령은? (netstat + 옵션 2개)', a: ['netstat -an', 'netstat -na', 'netstat -a -n', 'netstat -n -a'], e: '-a = all(모두), -n = numeric(이름 대신 숫자). -r = 라우팅 테이블, -o = PID.' },
    { id: 'k07', c: 'console', type: 'input', q: 'IP와 MAC 주소 대응표(ARP 캐시)를 보는 명령은?', a: ['arp -a', 'arp /a'], e: 'ARP = Address Resolution Protocol. 지우기는 arp -d.' },
    { id: 'k08', c: 'console', type: 'input', q: '윈도우 라우팅 테이블을 보는 명령은? (route 사용)', a: ['route print'], e: 'netstat -r도 같은 표를 보여 줍니다.' },
    { id: 'k09', c: 'console', type: 'input', q: '도메인 이름으로 IP를 조회해 DNS가 되는지 확인하는 명령은?', a: ['nslookup'], e: 'nslookup = name server lookup.' },
    { id: 'k10', c: 'console', type: 'input', q: 'C 드라이브의 파일 시스템 오류를 검사하고 고치는 명령은?', a: ['chkdsk c: /f', 'chkdsk /f c:', 'chkdsk /f'], e: 'chkdsk = check disk. /f = 오류 수정, /r = 불량 섹터 찾기(/f 포함).' },
    { id: 'k11', c: 'console', type: 'input', q: '손상된 윈도우 시스템 파일을 검사·복구하는 명령은?', a: ['sfc /scannow'], e: 'SFC = System File Checker.' },
    { id: 'k12', c: 'console', type: 'input', q: 'FAT32 드라이브 C를 데이터를 지우지 않고 NTFS로 바꾸는 명령은?', a: ['convert c: /fs:ntfs'], e: 'NTFS = New Technology File System. 반대로(NTFS → FAT32)는 이 명령으로 안 됩니다.' },
    { id: 'k13', c: 'console', type: 'input', q: '10분(600초) 뒤에 컴퓨터를 끄는 명령은?', a: ['shutdown /s /t 600', 'shutdown -s -t 600', 'shutdown /t 600 /s', 'shutdown -t 600 -s'], e: '/s = 끄기, /r = 다시 시작, /t = 초, /a = 예약 취소.' },
    { id: 'k14', c: 'console', type: 'input', q: '실행 창에서 장치 관리자를 여는 입력은?', a: ['devmgmt.msc'], e: 'device management. 디스크 관리는 diskmgmt.msc, 서비스는 services.msc.' },
    { id: 'k15', c: 'console', type: 'input', q: '시작 프로그램·부팅 옵션을 바꾸는 "시스템 구성" 도구를 여는 입력은?', a: ['msconfig'], e: 'msconfig = Microsoft System Configuration.' },
    { id: 'k16', c: 'console', type: 'input', q: '레지스트리 편집기를 여는 입력은?', a: ['regedit', 'regedit.exe', 'regedt32'], e: 'regedit = registry editor.' },
    { id: 'k17', c: 'console', type: 'input', q: '원격 데스크톱 연결 프로그램을 여는 입력은?', a: ['mstsc', 'mstsc.exe'], e: 'mstsc = Microsoft Terminal Services Client. 포트 3389.' },
    { id: 'k18', c: 'console', type: 'input', q: 'DirectX 진단 도구(그래픽·사운드 정보)를 여는 입력은?', a: ['dxdiag', 'dxdiag.exe'], e: 'dxdiag = DirectX diagnostic.' },
    { id: 'k19', c: 'console', type: 'input', q: '이벤트 뷰어(오류 기록)를 여는 입력은?', a: ['eventvwr', 'eventvwr.msc'], e: 'event viewer.' },
    { id: 'k20', c: 'console', type: 'input', q: '실행 중인 프로그램(프로세스) 목록을 명령 창에서 보는 명령은?', a: ['tasklist'], e: '강제 종료는 taskkill /im 이름 /f.' },
    // 윈도우·레지스트리
    { id: 'g01', c: 'reg', type: 'choice', q: '지금 로그온한 사용자의 설정이 들어 있는 레지스트리 루트 키는?', o: ['HKEY_CLASSES_ROOT', 'HKEY_CURRENT_USER', 'HKEY_LOCAL_MACHINE', 'HKEY_CURRENT_CONFIG'], a: 1, e: 'CURRENT_USER = 현재 사용자. (2008년 1회 필기에도 출제)' },
    { id: 'g02', c: 'reg', type: 'choice', q: '컴퓨터 전체의 하드웨어·소프트웨어 설정이 들어 있는 루트 키는?', o: ['HKEY_USERS', 'HKEY_LOCAL_MACHINE', 'HKEY_CURRENT_USER', 'HKEY_CLASSES_ROOT'], a: 1, e: 'LOCAL_MACHINE = 이 컴퓨터. 모든 사용자에게 적용됩니다.' },
    { id: 'g03', c: 'reg', type: 'choice', q: '파일 확장자를 어떤 프로그램으로 열지 정보가 들어 있는 루트 키는?', o: ['HKEY_CLASSES_ROOT', 'HKEY_CURRENT_CONFIG', 'HKEY_USERS', 'HKEY_LOCAL_MACHINE\\SYSTEM'], a: 0, e: 'CLASSES_ROOT = 파일 형식(클래스) 연결.' },
    { id: 'g04', c: 'reg', type: 'choice', q: '32비트 숫자를 저장하는 레지스트리 값 종류는?', o: ['REG_SZ', 'REG_DWORD', 'REG_QWORD', 'REG_MULTI_SZ'], a: 1, e: 'DWORD = double word = 32비트. QWORD = 64비트, SZ = 문자열.' },
    { id: 'g05', c: 'reg', type: 'choice', q: '모든 사용자에게 적용되는 시작 프로그램을 등록하는 레지스트리 경로는?', o: ['HKCU\\Control Panel\\Desktop', 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', 'HKCR\\.txt', 'HKCC\\System'], a: 1, e: 'HKLM ...\\Run = 모든 사용자. HKCU ...\\Run = 현재 사용자만.' },
    { id: 'g06', c: 'reg', type: 'choice', q: '원격 데스크톱 연결을 허용하는 곳은?', o: ['제어판 → 사용자 계정', '시스템 속성(sysdm.cpl) → 원격 탭', '네트워크 연결 → TCP/IPv4 속성', '장치 관리자'], a: 1, e: '시스템 속성 → 원격 → "이 컴퓨터에 대한 원격 연결 허용".' },
    { id: 'g07', c: 'reg', type: 'choice', q: '폴더에 사용자별 NTFS 권한(허용·거부)을 주는 곳은?', o: ['속성 → 공유 탭', '속성 → 보안 탭', '속성 → 일반 탭 → 읽기 전용', '디스크 관리'], a: 1, e: 'NTFS 권한 = 보안 탭. 네트워크 공유 권한 = 공유 탭 → 고급 공유 → 권한.' },
    { id: 'g08', c: 'reg', type: 'choice', q: '가상 메모리(페이징 파일) 크기를 바꾸는 경로는?', o: ['시스템 속성 → 고급 → 성능 설정 → 고급 → 가상 메모리 변경', '디스크 관리 → 볼륨 확장', '작업 관리자 → 메모리', '장치 관리자 → 메모리'], a: 0, e: 'sysdm.cpl → 고급 → 성능 [설정] → 고급 → 가상 메모리 [변경].' },
    // 부품
    { id: 'h01', c: 'hw', type: 'choice', q: '데스크톱용 DDR4 메모리의 핀 수는?', o: ['184핀', '240핀', '288핀', '260핀'], a: 2, e: 'DDR4 DIMM = 288핀(DDR5도 288핀). 노트북 DDR4 SO-DIMM = 260핀.' },
    { id: 'h02', c: 'hw', type: 'choice', q: '데스크톱용 DDR3 메모리의 핀 수는?', o: ['168핀', '184핀', '240핀', '288핀'], a: 2, e: 'DDR2·DDR3 = 240핀. 홈 위치가 달라 서로 꽂히지 않습니다.' },
    { id: 'h03', c: 'hw', type: 'choice', q: 'SDRAM(DIMM)의 핀 수는?', o: ['144핀', '168핀', '184핀', '240핀'], a: 1, e: 'SDRAM 168 → DDR 184 → DDR2/3 240 → DDR4/5 288.' },
    { id: 'h04', c: 'hw', type: 'choice', q: 'PS/2 키보드 단자의 색은?', o: ['초록색', '보라색', '분홍색', '파란색'], a: 1, e: '키보드 보라, 마우스 초록.' },
    { id: 'h05', c: 'hw', type: 'choice', q: '마이크를 꽂는 오디오 단자의 색은?', o: ['연두색', '하늘색', '분홍색', '주황색'], a: 2, e: '연두 = 스피커(라인 출력), 분홍 = 마이크, 하늘 = 라인 입력.' },
    { id: 'h06', c: 'hw', type: 'choice', q: '그래픽카드를 꽂는 슬롯은?', o: ['PCIe x1', 'PCIe x16', 'M.2', 'DIMM'], a: 1, e: 'PCIe x16 = 그래픽카드. x1은 랜카드·사운드카드 같은 작은 카드.' },
    { id: 'h07', c: 'hw', type: 'choice', q: 'CPU에 따로 전원을 주는 커넥터는?', o: ['24핀 ATX', '4/8핀 ATX12V(EPS)', 'SATA 전원', 'Molex 4핀'], a: 1, e: '24핀 = 메인보드 주 전원, 4/8핀 = CPU 보조 전원.' },
    { id: 'h08', c: 'hw', type: 'choice', q: '사우스브리지(PCH)가 주로 연결하는 장치는?', o: ['CPU와 메모리', 'USB·SATA·오디오 같은 저속 입출력', '그래픽카드만', '전원 공급 장치'], a: 1, e: '노스브리지 = 고속(CPU·메모리·그래픽), 사우스브리지 = 저속 입출력.' },
    { id: 'h09', c: 'hw', type: 'choice', q: 'CMOS 배터리의 일반적인 규격은?', o: ['AA', 'CR2032', '9V', 'AAA'], a: 1, e: '동전 모양 리튬 전지 CR2032.' },
    { id: 'h10', c: 'hw', type: 'multi', q: 'USB 3.0 단자의 특징을 모두 고르세요.', o: ['보통 파란색 단자', '이론 최대 5Gbps', '이론 최대 480Mbps', 'USB 2.0 장치도 꽂힌다'], a: [0, 1, 3], e: 'USB 3.0(3.2 Gen 1) = 5Gbps, 보통 파란색, 하위 호환. 480Mbps는 USB 2.0 속도입니다.' },
  ];

  const CATS = {
    net: [['router', '라우터'], ['win', '윈도우 서버'], ['linux', '리눅스'], ['short', '단답형'], ['cable', '케이블']],
    pc: [['cmos', 'CMOS'], ['console', '콘솔'], ['reg', '윈도우·레지스트리'], ['hw', '부품'], ['cable', '케이블']],
  };

  return {
    EXAM, PLAN, DAY, CABLE, STEPS, RTYPES, MISSIONS, MISSION_CMDS, BIOS, MATCH, CATS,
    net: {
      secs: [['start', '개요·전략'], ['cable', '케이블'], ['win', '윈도우 서버'], ['router', '라우터'], ['linux', '리눅스'], ['short', '단답형'], ['drill', '실전 문제'], ['day', '시험 당일']],
      html: { start: NET_START, win: NET_WIN, router: NET_ROUTER, linux: NET_LINUX, short: NET_SHORT },
      drill: NET_DRILL.concat(CABLE_DRILL),
      notes: [['win-svc', 'Windows 서버 서비스'], ['linux-basic', 'Linux 기본'], ['linux-net', 'Linux 네트워크'], ['app', '포트 번호'], ['osi', 'OSI 7계층'], ['routing', '라우팅 프로토콜'], ['security', '보안·VPN'], ['subnet', '서브넷 계산']],
    },
    pc: {
      secs: [['start', '개요·전략'], ['cable', '케이블'], ['cmos', 'CMOS 설정'], ['console', '콘솔 명령어'], ['wintask', '윈도우·레지스트리'], ['drag', '부품·드래그'], ['drill', '실전 문제'], ['day', '시험 당일']],
      html: { start: PC_START, cmos: PC_CMOS, console: PC_CONSOLE, wintask: PC_WIN, drag: PC_DRAG },
      drill: PC_DRILL.concat(CABLE_DRILL),
      notes: [['pc-bios', 'BIOS·UEFI·CMOS'], ['pc-wintools', '관리 도구·실행 명령'], ['pc-mem', '메모리'], ['pc-board', '메인보드·버스'], ['pc-port', '인터페이스·포트'], ['pc-proto', '프로토콜·명령어']],
    },
  };
})();
