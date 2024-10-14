// 设置基本参数
const datasetId = 1;  // overview-meeting 数据集ID为1
let currentPage = 1;
const itemsPerPage = 5;
let accessToken = '';  // 存储动态获取的 Access Token
let toggle = true;  // 用于切换字段显示
let intervalId;

// 获取 Access Token
async function getAccessToken() {
    const clientId = 'b697da9dede74a1b90bd12e048c55b80b5a7e564';
    const clientSecret = '43fbb6d1580ad834e1d427e8a51d6bf9ba86ac7bfc4960f7b7cd8e34a8d9d57952ec47615ddad4aef9c81ca10725655897e2471c1da44be5f8705c78dfddef22a70771b824739ba80662d28e26248f6e29346a89f42bcbd573083a6297fbc0083d44f60396e1c7fb1e2b0faea1eb0bfc85ec233de9fce48233ec0e855da0ef';

    try {
        const response = await fetch('https://glacial-sands-72080-04219ba46fd2.herokuapp.com/https://feifantest.xibo.co.uk/api/authorize/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch access token: ${response.statusText}`);
        }

        const data = await response.json();
        accessToken = data.access_token;
        console.log("Access Token:", accessToken);  // 输出 Access Token 用于调试
        return accessToken;
    } catch (error) {
        console.error('Error fetching access token:', error);
        return null;
    }
}

// 获取会议数据
async function fetchDatasetData() {
    try {
        // const filterCondition = `building = 'E' AND LPAD(endTime, 5, '0') > '10:00:00'`;
        const filterCondition = `building = 'E' AND LPAD(endTime, 5, '0') > TIME(NOW())`;
        const response = await fetch(`https://glacial-sands-72080-04219ba46fd2.herokuapp.com/https://feifantest.xibo.co.uk/api/dataset/data/${datasetId}?filter=${encodeURIComponent(filterCondition)}&start=0&length=100`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch dataset data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Fetched Data:", data);  // 输出获取的数据用于调试
        return data;
    } catch (error) {
        console.error('Error fetching dataset data:', error);
        return null;
    }
}

// 渲染会议信息，包含状态
async function displayMeetings(data) {
    const meetingContainer = document.getElementById('meeting-container');
    meetingContainer.style.opacity = 0; // 隐藏当前内容
    meetingContainer.innerHTML = ''; // 清空之前的数据

    let allMeetingsHTML = ''; // 用于存储所有会议条目的HTML

    data.forEach(item => {
        let statusText = '';
        let statusSymbol = '';

        // 判断 closed 字段并显示对应的符号
        if (item.closed === 'Y') {
            statusText = 'Private';
            statusSymbol = '🔒';  // 使用黑色锁符号
        } else {
            statusText = 'Public';
            statusSymbol = '✔️';  // 使用黑色对号符号
        }

        // 拼接每个会议条目的HTML
        const meetingItem = `
            <div class="meeting-wrapper">
                <div class="start-time">${item.startTime}</div> <!-- startTime 独立显示 -->
                <div class="meeting-item">
                    <div class="info">
                        <div class="title" data-organ="${item.organAcronym}" data-french="${item.frenchOrganAcronym}">${item.organAcronym}</div>
                        <div class="subtitle" data-shorttitle="${item.shortTitle}" data-frenchshorttitle="${item.frenchShortTitle}">${item.shortTitle}</div>
                    </div>
                    <div class="room">
                        <div class="room-text">${item.room}</div>
                        <div class="floor-text">Salle/Room</div>
                    </div>
                    <div class="floor">
                        <div class="room-text">Niveau 3</div>
                        <div class="floor-text">Etage/Floor</div>
                    </div>
                    <div class="status">
                        <div class="status-symbol">${statusSymbol}</div> <!-- 显示符号在上 -->
                        <div class="status-text">${statusText}</div> <!-- 显示文本在下 -->
                    </div>
                    <div class="blank"></div>
                </div>
            </div>
        `;
        allMeetingsHTML += meetingItem;
    });

    meetingContainer.insertAdjacentHTML('beforeend', allMeetingsHTML);
    console.log("Rendered HTML:", allMeetingsHTML);  // 输出渲染的HTML用于调试

    setTimeout(() => {
        meetingContainer.style.opacity = 1;
    }, 50); // 延迟 50 毫秒，等待 DOM 渲染完成
}


// 分页逻辑
function paginate(meetings, itemsPerPage) {
    const totalPages = Math.ceil(meetings.length / itemsPerPage);

    function updatePagination() {
        const pageNumbers = document.getElementById('page-numbers');
        pageNumbers.innerHTML = ''; // 清空之前的页码

        if (totalPages <= 1) {
            pageNumbers.style.display = 'none';
            return;
        } else {
            pageNumbers.style.display = 'flex';
        }

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('span');
            pageButton.textContent = i;
            pageButton.classList.add('page-number');
            if (i === currentPage) {
                pageButton.classList.add('selected');
            }
            pageButton.addEventListener('click', function () {
                currentPage = i;
                renderPage();
            });
            pageNumbers.appendChild(pageButton);
        }
    }

    function renderPage() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedItems = meetings.slice(start, end);

        displayMeetings(paginatedItems);
        updatePagination();
    }

    renderPage();

    // 每隔 10 秒翻页
    intervalId = setInterval(() => {
        if (currentPage < totalPages) {
            currentPage++;
        } else {
            currentPage = 1; // 回到第一页
        }
        renderPage();
    }, 10000); // 每10秒翻页
}

// 切换 organAcronym 和 shortTitle
function toggleFields() {
    const titles = document.querySelectorAll('.info .title');
    const subtitles = document.querySelectorAll('.info .subtitle');

    titles.forEach(title => {
        const currentText = title.textContent;
        const organAcronym = title.getAttribute('data-organ');
        const frenchOrganAcronym = title.getAttribute('data-french');
        title.textContent = (currentText === organAcronym) ? frenchOrganAcronym : organAcronym;
    });

    subtitles.forEach(subtitle => {
        const currentText = subtitle.textContent;
        const shortTitle = subtitle.getAttribute('data-shorttitle');
        const frenchShortTitle = subtitle.getAttribute('data-frenchshorttitle');
        subtitle.textContent = (currentText === shortTitle) ? frenchShortTitle : shortTitle;
    });
}

// 获取 Access Token 并初始化分页和切换逻辑
getAccessToken().then((token) => {
    if (token) {
        fetchDatasetData().then(data => {
            if (data) {
                paginate(data, itemsPerPage);

                // 每隔 5 秒切换 organAcronym 和 shortTitle
                setInterval(toggleFields, 5000);
            }
        });
    }
});
