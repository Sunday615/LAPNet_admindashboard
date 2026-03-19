<!-- src/views/AdminDashboard.vue -->
<template>
  <div ref="dashEl" class="dash">
    <div ref="topBarEl" class="dashTop js-reveal">
      <div ref="searchWrapEl" class="searchWrap" @keydown.esc.prevent="closeSearch">
        <i class="fa-solid fa-magnifying-glass searchIcon"></i>

        <input
          v-model.trim="searchQuery"
          class="searchInput"
          type="search"
          placeholder="Search everything... (members, board, news, jobs, announcement, employees)"
          @focus="openSearch"
          @keydown.enter.prevent="onSearchEnter"
        />

        <button v-if="searchQuery" class="searchClear" type="button" title="Clear" @click="clearSearch">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <div v-if="showSearchPanel" class="searchPanel" role="listbox">
          <div class="searchPanelTop">
            <div class="searchPanelTitle">
              <i class="fa-solid fa-sparkles"></i>
              Results for: <b>{{ searchQuery || "-" }}</b>
            </div>
            <div class="searchPanelMeta">
              <span class="pillMini">
                <i class="fa-solid fa-list"></i>
                {{ searchTotal }} matches
              </span>
              <button class="pillBtn" type="button" @click="closeSearch">
                Close <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <div v-if="!searchQuery" class="searchEmpty">
            Start typing to search everything.
          </div>

          <div v-else-if="!searchTotal" class="searchEmpty">
            No matches. Try a different keyword.
          </div>

          <div v-else class="searchGroups">
            <div v-for="g in searchGroups" :key="g.key" class="searchGroup" v-show="g.items.length">
              <div class="searchGroupHead">
                <div class="searchGroupTitle">
                  <i :class="g.icon"></i>
                  {{ g.label }}
                  <span class="groupCount">{{ g.items.length }}</span>
                </div>

                <button class="seeAllBtn" type="button" @click="goToCategorySearch(g.route)">
                  See all <i class="fa-solid fa-arrow-right"></i>
                </button>
              </div>

              <div class="searchItems">
                <button
                  v-for="(it, idx) in g.items"
                  :key="it._key || idx"
                  class="searchItem"
                  type="button"
                  @click="goToCategorySearch(g.route)"
                >
                  <div class="searchItemMain">
                    <div class="searchItemTitle">{{ it._title || "Untitled" }}</div>
                    <div class="searchItemSub" v-if="it._sub">{{ it._sub }}</div>
                  </div>
                  <i class="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="searchPanelHint">
            <i class="fa-solid fa-circle-info"></i>
            Tip: press Enter to jump to the most relevant page.
          </div>
        </div>
      </div>

      <div class="topActions">
        <div class="menuWrap" ref="notifWrapEl">
          <button class="iconBtn" type="button" title="Notifications" @click="toggleNotif">
            <i class="fa-solid fa-bell"></i>
            <span v-if="notifUnreadCount" class="badge">{{ notifUnreadCount }}</span>
          </button>

          <div v-if="showNotifMenu" class="menuPanel" role="menu">
            <div class="menuTop">
              <div class="menuTitle">
                <i class="fa-solid fa-bell"></i>
                Notifications
              </div>
              <button class="menuBtn" type="button" @click="markAllNotifRead">
                Mark all read
              </button>
            </div>

            <div v-if="!notifications.length" class="menuEmpty">No notifications</div>

            <div v-else class="menuList">
              <button
                v-for="n in notifications.slice(0, 8)"
                :key="n.id"
                class="menuItem"
                type="button"
                :class="{ unread: !n.read }"
                @click="openNotification(n)"
              >
                <div class="menuItemMain">
                  <div class="menuItemTitle">{{ n.title }}</div>
                  <div class="menuItemBody">{{ n.body }}</div>
                  <div class="menuItemTime">
                    <i class="fa-regular fa-clock"></i> {{ n.time }}
                  </div>
                </div>
                <span v-if="!n.read" class="dot"></span>
              </button>
            </div>

            <div class="menuFoot">
              <button class="menuLink" type="button" @click="toggleNotif">Close</button>
            </div>
          </div>
        </div>

        <div class="menuWrap" ref="chatWrapEl">
          <button class="iconBtn" type="button" title="Chat" @click="toggleChatMenu">
            <i class="fa-solid fa-comment-dots"></i>
            <span v-if="chatUnreadCount" class="badge">{{ chatUnreadCount }}</span>
          </button>

          <div v-if="showChatMenu" class="menuPanel" role="menu">
            <div class="menuTop">
              <div class="menuTitle">
                <i class="fa-solid fa-comment-dots"></i>
                Chat notifications
              </div>
              <button class="menuBtn" type="button" @click="markAllChatRead">
                Mark all read
              </button>
            </div>

            <div v-if="!chatNotifs.length" class="menuEmpty">No new chats</div>

            <div v-else class="menuList">
              <button
                v-for="c in chatNotifs.slice(0, 8)"
                :key="c.id"
                class="menuItem"
                type="button"
                :class="{ unread: !c.read }"
                @click="openChat(c)"
              >
                <div class="menuItemMain">
                  <div class="menuItemTitle">{{ c.from }}</div>
                  <div class="menuItemBody">{{ c.preview }}</div>
                  <div class="menuItemTime">
                    <i class="fa-regular fa-clock"></i> {{ c.time }}
                  </div>
                </div>
                <span v-if="!c.read" class="dot"></span>
              </button>
            </div>

            <div class="menuFoot">
              <button class="menuLink" type="button" @click="goChat">
                Open chat <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="menuWrap" ref="profileWrapEl">
          <button class="profileBtn" type="button" @click="toggleProfileMenu" title="Admin profile">
            <span class="avatar">
              <img v-if="adminAvatar" :src="adminAvatar" alt="admin" />
              <span v-else class="avatarTxt">{{ adminInitials }}</span>
            </span>
            <span class="profileName">{{ adminName }}</span>
            <i class="fa-solid fa-chevron-down"></i>
          </button>

          <div v-if="showProfileMenu" class="menuPanel" role="menu">
            <div class="profileTop">
              <div class="profileBig">
                <span class="avatar big">
                  <img v-if="adminAvatar" :src="adminAvatar" alt="admin" />
                  <span v-else class="avatarTxt">{{ adminInitials }}</span>
                </span>
                <div class="profileBigInfo">
                  <div class="profileBigName">{{ adminName }}</div>
                  <div class="profileBigSub">{{ adminRole }}</div>
                </div>
              </div>
            </div>

            <div class="menuList">
              <button class="menuItem menuAction" type="button" @click="goAdminProfile">
                <i class="fa-solid fa-id-card"></i>
                Profile
              </button>
              <button class="menuItem menuAction" type="button" @click="goAdminSettings">
                <i class="fa-solid fa-gear"></i>
                Settings
              </button>
              <button class="menuItem menuAction danger" type="button" @click="logout">
                <i class="fa-solid fa-right-from-bracket"></i>
                Logout
              </button>
            </div>
          </div>
        </div>

        <button class="chartRefreshBtn topRefresh" type="button" @click="refreshAll" title="Refresh all data">
          <i class="fa-solid fa-rotate-right"></i>
        </button>
      </div>
    </div>

    <div class="statGrid">
      <div
        ref="statCardEl"
        class="statCard js-reveal clickable"
        role="button"
        tabindex="0"
        @click="goMembers"
        @keydown.enter.prevent="goMembers"
        @keydown.space.prevent="goMembers"
        @mouseenter="cardHover($event, true)"
        @mouseleave="cardHover($event, false)"
      >
        <div class="statTop">
          <div class="statIcon">
            <i class="fa-solid fa-building-columns"></i>
          </div>
          <button class="statRefresh" type="button" @click.stop="fetchMemberTotal" title="Refresh">
            <i class="fa-solid fa-rotate-right"></i>
          </button>
        </div>

        <div class="statLabel">Total Member Bank</div>

        <div class="statValue">
          <span v-if="memberLoading" class="loadingWrap">
            <span class="spinner"></span>
            Loading...
          </span>
          <span v-else-if="memberError" class="statError">{{ memberError }}</span>
          <span v-else>{{ memberTotal }}</span>
        </div>

        <div class="statHint">{{ MEMBERS_API.replace(VITE_API_BASE_URL, "") }}</div>
        <span class="statGlow" />
        <span class="cardSheen" />
      </div>

      <div
        ref="announcementCardEl"
        class="statCard js-reveal clickable"
        role="button"
        tabindex="0"
        @click="goAnnouncement"
        @keydown.enter.prevent="goAnnouncement"
        @keydown.space.prevent="goAnnouncement"
        @mouseenter="cardHover($event, true)"
        @mouseleave="cardHover($event, false)"
      >
        <div class="statTop">
          <div class="statIcon">
            <i class="fa-solid fa-bullhorn"></i>
          </div>
          <button class="statRefresh" type="button" @click.stop="fetchAnnouncementTotal" title="Refresh">
            <i class="fa-solid fa-rotate-right"></i>
          </button>
        </div>

        <div class="statLabel">Total Announcement</div>

        <div class="statValue">
          <span v-if="announcementLoading" class="loadingWrap">
            <span class="spinner"></span>
            Loading...
          </span>
          <span v-else-if="announcementError" class="statError">{{ announcementError }}</span>
          <span v-else>{{ announcementTotal }}</span>
        </div>

        <div class="statHint">{{ ANNOUNCE_API.replace(VITE_API_BASE_URL, "") }}</div>
        <span class="statGlow" />
        <span class="cardSheen" />
      </div>

      <div
        ref="newsCardEl"
        class="statCard js-reveal clickable"
        role="button"
        tabindex="0"
        @click="goNews"
        @keydown.enter.prevent="goNews"
        @keydown.space.prevent="goNews"
        @mouseenter="cardHover($event, true)"
        @mouseleave="cardHover($event, false)"
      >
        <div class="statTop">
          <div class="statIcon">
            <i class="fa-solid fa-newspaper"></i>
          </div>
          <button class="statRefresh" type="button" @click.stop="fetchNewsTotal" title="Refresh">
            <i class="fa-solid fa-rotate-right"></i>
          </button>
        </div>

        <div class="statLabel">Total News</div>

        <div class="statValue">
          <span v-if="newsLoading" class="loadingWrap">
            <span class="spinner"></span>
            Loading...
          </span>
          <span v-else-if="newsError" class="statError">{{ newsError }}</span>
          <span v-else>{{ newsTotal }}</span>
        </div>

        <div class="statHint">{{ NEWS_API.replace(VITE_API_BASE_URL, "") }}</div>
        <span class="statGlow" />
        <span class="cardSheen" />
      </div>

      <div
        ref="jobsCardEl"
        class="statCard js-reveal clickable"
        role="button"
        tabindex="0"
        @click="goJobs"
        @keydown.enter.prevent="goJobs"
        @keydown.space.prevent="goJobs"
        @mouseenter="cardHover($event, true)"
        @mouseleave="cardHover($event, false)"
      >
        <div class="statTop">
          <div class="statIcon">
            <i class="fa-solid fa-user-plus"></i>
          </div>
          <button class="statRefresh" type="button" @click.stop="fetchJobTotal" title="Refresh">
            <i class="fa-solid fa-rotate-right"></i>
          </button>
        </div>

        <div class="statLabel">Total Jobs</div>

        <div class="statValue">
          <span v-if="jobLoading" class="loadingWrap">
            <span class="spinner"></span>
            Loading...
          </span>
          <span v-else-if="jobError" class="statError">{{ jobError }}</span>
          <span v-else>{{ jobTotal }}</span>
        </div>

        <div class="statHint">{{ JOBS_API.replace(VITE_API_BASE_URL, "") }}</div>
        <span class="statGlow" />
        <span class="cardSheen" />
      </div>

      <div
        ref="boardCardEl"
        class="statCard js-reveal clickable wide"
        role="button"
        tabindex="0"
        @click="goBoardDirector"
        @keydown.enter.prevent="goBoardDirector"
        @keydown.space.prevent="goBoardDirector"
        @mouseenter="cardHover($event, true)"
        @mouseleave="cardHover($event, false)"
      >
        <div class="statTop">
          <div class="statIcon">
            <i class="fa-solid fa-user-tie"></i>
          </div>
          <button class="statRefresh" type="button" @click.stop="fetchBoardTotal" title="Refresh">
            <i class="fa-solid fa-rotate-right"></i>
          </button>
        </div>

        <div class="statLabel">Total Board Director</div>

        <div class="statValue">
          <span v-if="boardLoading" class="loadingWrap">
            <span class="spinner"></span>
            Loading...
          </span>
          <span v-else-if="boardError" class="statError">{{ boardError }}</span>
          <span v-else>{{ boardTotal }}</span>
        </div>

        <div class="statHint">{{ BOARD_API.replace(VITE_API_BASE_URL, "") }}</div>
        <span class="statGlow" />
        <span class="cardSheen" />
      </div>

      <div
        ref="lapnetStatCardEl"
        class="statCard js-reveal clickable wide"
        role="button"
        tabindex="0"
        @click="goLapnetEmp"
        @keydown.enter.prevent="goLapnetEmp"
        @keydown.space.prevent="goLapnetEmp"
        @mouseenter="cardHover($event, true)"
        @mouseleave="cardHover($event, false)"
      >
        <div class="statTop">
          <div class="statIcon">
            <i class="fa-solid fa-users"></i>
          </div>
          <button class="statRefresh" type="button" @click.stop="fetchLapnetEmpTotal" title="Refresh">
            <i class="fa-solid fa-rotate-right"></i>
          </button>
        </div>

        <div class="statLabel">Total Lapnet Employee</div>

        <div class="statValue">
          <span v-if="lapnetEmpLoading" class="loadingWrap">
            <span class="spinner"></span>
            Loading...
          </span>
          <span v-else-if="lapnetEmpError" class="statError">{{ lapnetEmpError }}</span>
          <span v-else>{{ lapnetEmpTotal }}</span>
        </div>

        <div class="statHint">{{ EMP_LAPNET_API.replace(VITE_API_BASE_URL, "") }}</div>
        <span class="statGlow" />
        <span class="cardSheen" />
      </div>

      <div class="leftCol">
        <div ref="chartCardEl" class="chartCard js-reveal">
          <div class="chartTop">
            <div class="chartTitle">
              <span class="chartBadge"><i class="fa-solid fa-chart-area"></i></span>
              <div class="chartTitleText">
                <div class="chartH">Posting Activity</div>
                <div class="chartSub">Overview + filter by category (7 days / 30 days / 3 months)</div>
              </div>
            </div>

            <div class="chartActions">
              <div class="segmented">
                <button
                  v-for="r in ranges"
                  :key="r.key"
                  class="segBtn"
                  type="button"
                  :class="{ active: rangeKey === r.key }"
                  @click="setRange(r.key)"
                >
                  {{ r.label }}
                </button>
              </div>

              <button class="chartRefreshBtn" type="button" @click="refreshAll" title="Refresh all data">
                <i class="fa-solid fa-rotate-right"></i>
              </button>
            </div>
          </div>

          <div class="chipRow">
            <button
              v-for="c in categories"
              :key="c.key"
              class="chip"
              type="button"
              :class="[c.key, { active: categoryKey === c.key }]"
              @click="setCategory(c.key)"
            >
              <span class="chipDot"></span>
              <span class="chipText">{{ c.label }}</span>
            </button>
          </div>

          <div class="chartMeta">
            <div class="metaPill">
              <i class="fa-solid fa-calendar-days"></i>
              <span>Range:</span>
              <b>{{ rangeLabel }}</b>
            </div>

            <div class="metaPill">
              <i class="fa-solid fa-layer-group"></i>
              <span>View:</span>
              <b>{{ categoryLabel }}</b>
            </div>

            <div class="metaPill" v-if="anyLoading">
              <span class="spinner"></span>
              Loading data...
            </div>

            <div class="metaPill errorPill" v-else-if="anyError">
              <i class="fa-solid fa-triangle-exclamation"></i>
              {{ anyError }}
            </div>

            <div class="metaPill" v-else>
              <i class="fa-solid fa-signal"></i>
              <span>Total in range:</span>
              <b>{{ rangeTotal }}</b>
            </div>

            <div class="metaPill" v-if="!anyLoading && !anyError">
              <i class="fa-solid fa-chart-line"></i>
              <span>Avg / day:</span>
              <b>{{ avgPerDay }}</b>
            </div>

            <div class="metaPill subtle" v-if="!anyLoading && !anyError && unknownDateCount">
              <i class="fa-solid fa-circle-info"></i>
              <span>Items w/o date:</span>
              <b>{{ unknownDateCount }}</b>
            </div>
          </div>

          <div class="chartCanvasWrap">
            <canvas ref="chartCanvasEl" class="chartCanvas"></canvas>

            <div v-if="anyLoading" class="chartOverlay">
              <span class="spinner"></span> Loading...
            </div>
            <div v-else-if="anyError" class="chartOverlay error">
              <i class="fa-solid fa-triangle-exclamation"></i>
              {{ anyError }}
            </div>
          </div>

          <div class="legend">
            <div class="legItem"><span class="legDot total"></span> Total</div>
            <div class="legItem"><span class="legDot bank"></span> Bank</div>
            <div class="legItem"><span class="legDot news"></span> News</div>
            <div class="legItem"><span class="legDot jobs"></span> Jobs</div>
            <div class="legItem"><span class="legDot announcement"></span> Announcement</div>

            <div class="legHint">
              <i class="fa-solid fa-circle-info"></i>
              Hover / touch to see detail
            </div>
          </div>

          <span class="chartGlow" />
          <span class="cardSheen" />
        </div>

        <div ref="newsPreviewEl" class="sideCard newsPreviewCard js-reveal">
          <div class="sideTop">
            <div class="sideTitle">
              <span class="sideBadge"><i class="fa-solid fa-newspaper"></i></span>
              <div>
                <div class="sideH">News Preview</div>
                <div class="sideSub">
                  Latest posts <span v-if="searchQuery" class="subSearchTag">• filtered</span>
                </div>
              </div>
            </div>

            <button class="sideRefresh" type="button" @click.stop="fetchNewsTotal" title="Refresh">
              <i class="fa-solid fa-rotate-right"></i>
            </button>
          </div>

          <div class="sideMeta">
            <span class="metaMini">
              <i class="fa-solid fa-database"></i>
              <b>{{ newsTotal }}</b>
              <span>Total</span>
            </span>

            <button class="sideLink" type="button" @click="goNews">
              View all <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <div class="newsPreviewBody">
            <div v-if="newsLoading" class="sideState">
              <span class="spinner"></span> Loading...
            </div>

            <div v-else-if="newsError" class="sideState errState">
              <i class="fa-solid fa-triangle-exclamation"></i>
              {{ newsError }}
            </div>

            <div v-else-if="!newsFilteredPreview.length" class="sideState">
              {{ searchQuery ? "No matches" : "No data" }}
            </div>

            <div v-else class="newsList">
              <div
                v-for="(n, idx) in newsFilteredPreview"
                :key="String(pick(n, 'id', 'news_id', 'slug') || idx)"
                class="newsItem"
                role="button"
                tabindex="0"
                @click="goNews"
                @keydown.enter.prevent="goNews"
                @keydown.space.prevent="goNews"
              >
                <div class="newsThumb">
                  <img
                    v-if="newsThumbSrc(n)"
                    :src="newsThumbSrc(n)"
                    :alt="pick(n, 'header_news', 'headerNews', 'news_title', 'title') || 'news'"
                  />
                  <div v-else class="newsThumbEmpty"><i class="fa-regular fa-image"></i></div>
                </div>

                <div class="newsInfo">
                  <div class="newsTitle">
                    {{
                      pick(n, "header_news", "headerNews", "news_title", "title", "name", "headline") || "Untitled"
                    }}
                  </div>

                  <div class="newsMeta">
                    <span class="miniChip subtle" v-if="parseAnyDate(n)">
                      <i class="fa-regular fa-clock"></i>
                      {{ fmtDateTime(parseAnyDate(n)) }}
                    </span>

                    <span class="miniChip" v-if="pick(n, 'category', 'news_category', 'type', 'tag')">
                      <i class="fa-solid fa-tag"></i>
                      {{ pick(n, "category", "news_category", "type", "tag") }}
                    </span>
                  </div>
                </div>

                <i class="fa-solid fa-chevron-right boardChevron"></i>
              </div>
            </div>
          </div>

          <span class="sideGlow" />
          <span class="cardSheen" />
        </div>
      </div>

      <div class="sideCol js-reveal">
        <div ref="boardSideEl" class="sideCard boardCard">
          <div class="boardHero" />

          <div class="sideTop">
            <div class="sideTitle">
              <span class="sideBadge"><i class="fa-solid fa-user-tie"></i></span>
              <div>
                <div class="sideH">Board Committee</div>
                <div class="sideSub">
                  Latest committee members <span v-if="searchQuery" class="subSearchTag">• filtered</span>
                </div>
              </div>
            </div>

            <button class="sideRefresh" type="button" @click.stop="fetchBoardTotal" title="Refresh">
              <i class="fa-solid fa-rotate-right"></i>
            </button>
          </div>

          <div class="sideMeta">
            <span class="metaMini">
              <i class="fa-solid fa-database"></i>
              <b>{{ boardTotal }}</b>
              <span>Total</span>
            </span>

            <button class="sideLink" type="button" @click="goBoardDirector">
              View all <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <div class="sideBody">
            <div v-if="boardLoading" class="sideState">
              <span class="spinner"></span> Loading...
            </div>

            <div v-else-if="boardError" class="sideState errState">
              <i class="fa-solid fa-triangle-exclamation"></i>
              {{ boardError }}
            </div>

            <div v-else-if="!boardFilteredPaged.length" class="sideState">
              {{ searchQuery ? "No matches" : "No data" }}
            </div>

            <div v-else class="boardList">
              <div
                v-for="(b, idx) in boardFilteredPaged"
                :key="String(b?.id ?? b?.director_id ?? b?.board_id ?? b?.name ?? idx)"
                class="boardItem"
                @click="goBoardDirector"
                @keydown.enter.prevent="goBoardDirector"
                @keydown.space.prevent="goBoardDirector"
                role="button"
                tabindex="0"
              >
                <div class="boardLogo">
                  <img :src="boardLogoSrc(b)" alt="logobank" />
                </div>

                <div class="boardInfo">
                  <div class="boardCommittee">
                    {{
                      pick(b, "commitee", "committee", "committee_name", "committeeName", "committeeTitle") || "Committee"
                    }}
                  </div>

                  <div class="boardNameRow">
                    <div class="boardName">
                      {{ pick(b, "name", "full_name", "director_name") || "-" }}
                    </div>

                    <span class="boardRolePill">
                      <i class="fa-solid fa-id-badge"></i>
                      {{ pick(b, "role", "position", "title") || "-" }}
                    </span>
                  </div>

                  <div class="boardMetaRow">
                    <span class="miniChip subtle" v-if="pick(b, 'department')">
                      <i class="fa-solid fa-building"></i>
                      {{ pick(b, "department") }}
                    </span>

                    <span class="miniChip subtle" v-if="pick(b, 'create_at', 'created_at', 'createdAt')">
                      <i class="fa-regular fa-clock"></i>
                      {{ String(pick(b, "create_at", "created_at", "createdAt")).slice(0, 19) }}
                    </span>
                  </div>
                </div>

                <i class="fa-solid fa-chevron-right boardChevron"></i>
              </div>

              <div class="boardPager" v-if="boardPageCountFiltered > 1">
                <button class="pagerBtn" type="button" @click.stop="boardPrev" :disabled="boardPage <= 1" title="Previous">
                  <i class="fa-solid fa-chevron-left"></i>
                </button>

                <div class="pagerInfo">Page {{ boardPage }} / {{ boardPageCountFiltered }}</div>

                <button
                  class="pagerBtn"
                  type="button"
                  @click.stop="boardNextFiltered"
                  :disabled="boardPage >= boardPageCountFiltered"
                  title="Next"
                >
                  <i class="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>

          <span class="sideGlow" />
          <span class="cardSheen" />
        </div>

        <div ref="lapnetSideEl" class="sideCard lapnetCard">
          <div class="sideTop">
            <div class="sideTitle">
              <span class="sideBadge"><i class="fa-solid fa-users"></i></span>
              <div>
                <div class="sideH">Lapnet Employees</div>
                <div class="sideSub">
                  3 per page <span v-if="searchQuery" class="subSearchTag">• filtered</span>
                </div>
              </div>
            </div>

            <button class="sideRefresh" type="button" @click.stop="fetchLapnetEmpTotal" title="Refresh">
              <i class="fa-solid fa-rotate-right"></i>
            </button>
          </div>

          <div class="sideMeta">
            <span class="metaMini">
              <i class="fa-solid fa-database"></i>
              <b>{{ lapnetEmpTotal }}</b>
              <span>Total</span>
            </span>

            <button class="sideLink" type="button" @click="goLapnetEmp">
              View all <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <div class="sideBody">
            <div v-if="lapnetEmpLoading" class="sideState">
              <span class="spinner"></span> Loading...
            </div>

            <div v-else-if="lapnetEmpError" class="sideState errState">
              <i class="fa-solid fa-triangle-exclamation"></i>
              {{ lapnetEmpError }}
            </div>

            <div v-else-if="!lapnetFilteredPaged.length" class="sideState">
              {{ searchQuery ? "No matches" : "No data" }}
            </div>

            <div v-else class="sideList">
              <div
                v-for="(emp, idx) in lapnetFilteredPaged"
                :key="String(emp?.emp_id ?? emp?.id ?? emp?.name ?? idx)"
                class="sideItem"
                @click="goLapnetEmp"
                @keydown.enter.prevent="goLapnetEmp"
                @keydown.space.prevent="goLapnetEmp"
                role="button"
                tabindex="0"
              >
                <div class="sideAvatar">
                  <img
                    v-if="resolveImageUrl(pick(emp, 'image', 'imageprofile', 'imageprodfile', 'photo', 'avatar'))"
                    :src="resolveImageUrl(pick(emp, 'image', 'imageprofile', 'imageprodfile', 'photo', 'avatar'))"
                    alt="emp"
                  />
                  <div v-else class="sideAvatarEmpty"><i class="fa-solid fa-user"></i></div>
                </div>

                <div class="sideInfo">
                  <div class="sideName">
                    <span class="miniChip subtle empNoChip">No. {{ lapnetStartIndex + idx + 1 }}</span>
                    {{ pick(emp, "name", "emp_name", "empName") || "-" }}
                  </div>

                  <div class="sideRole">
                    {{ pick(emp, "role") || "-" }}
                    <span v-if="pick(emp, 'department')"> • {{ pick(emp, "department") }}</span>
                  </div>

                  <div class="sideChips">
                    <span class="miniChip">
                      <i class="fa-solid fa-layer-group"></i>
                      {{ pick(emp, "position", "row") || "-" }}
                    </span>
                    <span class="miniChip subtle" v-if="pick(emp, 'create_at', 'created_at', 'createdAt')">
                      <i class="fa-regular fa-clock"></i>
                      {{ String(pick(emp, "create_at", "created_at", "createdAt")).slice(0, 19) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="boardPager" v-if="lapnetPageCountFiltered > 1">
                <button class="pagerBtn" type="button" @click.stop="lapnetPrev" :disabled="lapnetPage <= 1" title="Previous">
                  <i class="fa-solid fa-chevron-left"></i>
                </button>

                <div class="pagerInfo">Page {{ lapnetPage }} / {{ lapnetPageCountFiltered }}</div>

                <button
                  class="pagerBtn"
                  type="button"
                  @click.stop="lapnetNextFiltered"
                  :disabled="lapnetPage >= lapnetPageCountFiltered"
                  title="Next"
                >
                  <i class="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>

          <span class="sideGlow" />
          <span class="cardSheen" />
        </div>
      </div>

      <div class="calendarCard js-reveal">
        <div class="calTop">
          <div class="calTitle">
            <span class="calBadge"><i class="fa-solid fa-calendar-days"></i></span>
            <div>
              <div class="calH">Calendar</div>
              <div class="calSub">Quick notes / reminders (saved in localStorage)</div>
            </div>
          </div>

          <div class="calNav">
            <button class="calNavBtn" type="button" @click="prevMonth" title="Previous month">
              <i class="fa-solid fa-chevron-left"></i>
            </button>

            <div class="calMonth">
              <b>{{ calMonthLabel }}</b>
              <span class="muted">•</span>
              <span class="muted">{{ calYear }}</span>
            </div>

            <button class="calNavBtn" type="button" @click="nextMonth" title="Next month">
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>

        <div class="calGridWrap">
          <div class="calWeekHead">
            <div v-for="d in weekDays" :key="d" class="calWeekCell">{{ d }}</div>
          </div>

          <div class="calGrid">
            <button
              v-for="cell in calCells"
              :key="cell.key"
              class="calCell"
              type="button"
              :class="{
                blank: cell.blank,
                today: cell.key === todayKey,
                selected: cell.key === selectedDateKey,
                hasEvent: hasEvents(cell.key),
              }"
              :disabled="cell.blank"
              @click="selectDay(cell.key)"
            >
              <span class="calNum">{{ cell.blank ? "" : cell.day }}</span>
              <span v-if="hasEvents(cell.key) && !cell.blank" class="calDot"></span>
            </button>
          </div>
        </div>

        <div class="calBottom">
          <div class="calSide">
            <div class="calSideHead">
              <div class="calSideTitle">
                <i class="fa-regular fa-clock"></i>
                Events on <b class="mono">{{ selectedDateKey }}</b>
              </div>

              <button class="calClearBtn" type="button" @click="clearDayEvents" :disabled="!dayEvents.length">
                Clear day
              </button>
            </div>

            <div v-if="!dayEvents.length" class="calEmpty">
              <i class="fa-regular fa-note-sticky"></i>
              No events for this day.
            </div>

            <div v-else class="calEvents">
              <div v-for="ev in dayEvents" :key="ev.id" class="calEvent">
                <div class="calEventMain">
                  <div class="calEventTitle">{{ ev.title }}</div>
                  <div class="calEventMeta">
                    <span class="miniChip subtle" v-if="ev.time">
                      <i class="fa-regular fa-clock"></i> {{ ev.time }}
                    </span>
                    <span class="miniChip subtle" v-if="ev.note">
                      <i class="fa-regular fa-message"></i> {{ ev.note }}
                    </span>
                  </div>
                </div>

                <button class="calDelBtn" type="button" title="Delete" @click="askDeleteEvent(ev)">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="calForm">
            <div class="calFormHead">
              <div class="calFormTitle">
                <i class="fa-solid fa-plus"></i>
                Add event
              </div>
              <button class="calTodayBtn" type="button" @click="jumpToday">
                Today
              </button>
            </div>

            <div class="calFields">
              <div class="field">
                <div class="label">Title</div>
                <input v-model.trim="newEventTitle" class="input" placeholder="e.g., Deploy release / Meeting" />
              </div>

              <div class="fieldRow">
                <div class="field">
                  <div class="label">Time</div>
                  <input v-model.trim="newEventTime" class="input" placeholder="HH:MM" />
                </div>
                <div class="field">
                  <div class="label">Note</div>
                  <input v-model.trim="newEventNote" class="input" placeholder="optional" />
                </div>
              </div>

              <button class="btnPrimary" type="button" @click="addCalEvent" :disabled="!newEventTitle">
                <i class="fa-solid fa-floppy-disk"></i> Save
              </button>
            </div>

            <div class="calHint">
              <i class="fa-solid fa-circle-info"></i>
              Saved to <b>localStorage</b> only (admin browser).
            </div>
          </div>
        </div>

        <span class="chartGlow" />
        <span class="cardSheen" />
      </div>
    </div>

    <div v-if="confirmOpen" class="overlay" @click.self="closeConfirm">
      <div class="modal">
        <div class="modalTop">
          <div class="modalTitle">
            <i class="fa-solid fa-triangle-exclamation"></i>
            Confirm
          </div>
          <button class="xBtn" type="button" @click="closeConfirm"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modalBody">
          Delete event: <b class="mono">{{ confirmTarget?.title }}</b> ?
        </div>

        <div class="modalActions">
          <button class="btnGhost" type="button" @click="closeConfirm">Cancel</button>
          <button class="btnDanger" type="button" @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>

    <div class="toastWrap">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">
        <i :class="t.icon"></i>
        <div class="toastMsg">{{ t.msg }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import gsap from "gsap";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
  BarController,
  BarElement,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
  BarController,
  BarElement
);

const router = useRouter();
const dashEl = ref(null);

function goMembers() { router.push("/members"); }
function goBoardDirector() { router.push("/Board_directorview"); }
function goNews() { router.push("/newsviewer"); }
function goJobs() { router.push("/jobview"); }
function goAnnouncement() { router.push("/announcementviewer"); }
function goLapnetEmp() { router.push("/lapnetview"); }
function goChat() { router.push("/notifications"); }
function goAdminProfile() { router.push("/admin/profile"); }
function goAdminSettings() { router.push("/admin/settings"); }
function logout() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("auth_token");
  } catch {}
  router.push("/login");
}

const statCardEl = ref(null);
const boardCardEl = ref(null);
const newsCardEl = ref(null);
const jobsCardEl = ref(null);
const announcementCardEl = ref(null);
const chartCardEl = ref(null);
const newsPreviewEl = ref(null);

const lapnetStatCardEl = ref(null);
const lapnetSideEl = ref(null);
const boardSideEl = ref(null);

const topBarEl = ref(null);
const searchWrapEl = ref(null);
const notifWrapEl = ref(null);
const chatWrapEl = ref(null);
const profileWrapEl = ref(null);

const chartCanvasEl = ref(null);
let chartInst = null;

const VITE_API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

const RAW_FETCH_CREDENTIALS = String(import.meta?.env?.VITE_FETCH_CREDENTIALS || "").trim();
const FETCH_CREDENTIALS = ["include", "omit", "same-origin"].includes(RAW_FETCH_CREDENTIALS)
  ? RAW_FETCH_CREDENTIALS
  : "";

const MEMBERS_API = `${VITE_API_BASE_URL}/api/members`;
const BOARD_API = `${VITE_API_BASE_URL}/api/boarddirector`;
const NEWS_API = `${VITE_API_BASE_URL}/api/news`;
const ANNOUNCE_API = `${VITE_API_BASE_URL}/api/announcement`;
const JOBS_API = `${VITE_API_BASE_URL}/api/jobs`;
const EMP_LAPNET_API = `${VITE_API_BASE_URL}/api/emp_lapnet`;

const memberItems = ref([]);
const boardItems = ref([]);
const newsItems = ref([]);
const jobItems = ref([]);
const announcementItems = ref([]);
const lapnetEmpItems = ref([]);

const BOARD_LOGO_FALLBACK = "/logobank.png";

function resolveImageUrl(v, baseOverride) {
  if (!v) return "";

  let s = String(v).trim();
  if (!s) return "";

  s = s.replace(/\\/g, "/");

  if (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("data:") ||
    s.startsWith("blob:")
  ) {
    return s;
  }

  const baseRaw = baseOverride || VITE_API_BASE_URL;
  const base = String(baseRaw || "").trim().replace(/\/+$/, "");
  if (!base) return s;

  if (s.startsWith("./")) s = s.slice(2);

  if (s.startsWith("/")) return `${base}${s}`;

  return `${base}/${s}`;
}

function boardLogoSrc(b) {
  const nested =
    b?.bank?.logo ||
    b?.bank?.banklogo ||
    b?.bank?.bank_logo ||
    b?.bankInfo?.logo ||
    b?.bankInfo?.banklogo;

  const raw =
    nested ||
    pick(
      b,
      "banklogo",
      "bank_logo",
      "logo",
      "logobank",
      "logo_bank",
      "logofile",
      "logoFile",
      "logo_path",
      "logoPath",
      "bank_logo_path",
      "bankLogo",
      "bankLogoUrl",
      "bank_logo_url"
    );

  return resolveImageUrl(raw) || BOARD_LOGO_FALLBACK;
}

function getToken() {
  try {
    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token") ||
      ""
    );
  } catch {
    return "";
  }
}

async function fetchList(url, abortCtrlRef, loadingRef, errorRef, itemsRef) {
  try {
    errorRef.value = "";
    loadingRef.value = true;

    if (abortCtrlRef.value) abortCtrlRef.value.abort();
    abortCtrlRef.value = new AbortController();

    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const opts = { signal: abortCtrlRef.value.signal, headers };
    if (FETCH_CREDENTIALS) opts.credentials = FETCH_CREDENTIALS;

    const res = await fetch(url, opts);

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}${txt ? ` • ${txt.slice(0, 140)}` : ""}`);
    }

    const data = await res.json();

    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.members)
            ? data.members
            : Array.isArray(data?.news)
              ? data.news
              : Array.isArray(data?.jobs)
                ? data.jobs
                : Array.isArray(data?.announcements)
                  ? data.announcements
                  : Array.isArray(data?.announcement)
                    ? data.announcement
                    : Array.isArray(data?.boarddirectors)
                      ? data.boarddirectors
                      : Array.isArray(data?.boarddirector)
                        ? data.boarddirector
                        : Array.isArray(data?.directors)
                          ? data.directors
                          : Array.isArray(data?.emp_lapnet)
                            ? data.emp_lapnet
                            : Array.isArray(data?.employees)
                              ? data.employees
                              : [];

    itemsRef.value = list;
    return list;
  } catch (err) {
    if (err?.name === "AbortError") return null;

    const msg = String(err?.message || "Failed to load");
    errorRef.value = msg;

    console.error("[fetchList]", url, err);
    return null;
  } finally {
    loadingRef.value = false;
  }
}

const memberTotal = ref(0);
const memberLoading = ref(false);
const memberError = ref("");
const memberAbortCtrl = ref(null);

const boardTotal = ref(0);
const boardLoading = ref(false);
const boardError = ref("");
const boardAbortCtrl = ref(null);

const lapnetEmpTotal = ref(0);
const lapnetEmpLoading = ref(false);
const lapnetEmpError = ref("");
const lapnetEmpAbortCtrl = ref(null);

const newsTotal = ref(0);
const newsLoading = ref(false);
const newsError = ref("");
const newsAbortCtrl = ref(null);

const jobTotal = ref(0);
const jobLoading = ref(false);
const jobError = ref("");
const jobAbortCtrl = ref(null);

const announcementTotal = ref(0);
const announcementLoading = ref(false);
const announcementError = ref("");
const announcementAbortCtrl = ref(null);

async function fetchMemberTotal() {
  const list = await fetchList(MEMBERS_API, memberAbortCtrl, memberLoading, memberError, memberItems);
  if (!list) return;
  memberTotal.value = list.length;
  if (statCardEl.value) gsap.fromTo(statCardEl.value, { y: 8 }, { y: 0, duration: 0.28, ease: "power2.out" });
}

async function fetchBoardTotal() {
  const list = await fetchList(BOARD_API, boardAbortCtrl, boardLoading, boardError, boardItems);
  if (!list) return;
  boardTotal.value = list.length;
  boardPage.value = 1;

  if (boardCardEl.value) gsap.fromTo(boardCardEl.value, { y: 8 }, { y: 0, duration: 0.28, ease: "power2.out" });
  if (boardSideEl.value) gsap.fromTo(boardSideEl.value, { y: 8 }, { y: 0, duration: 0.28, ease: "power2.out" });
}

async function fetchLapnetEmpTotal() {
  const list = await fetchList(EMP_LAPNET_API, lapnetEmpAbortCtrl, lapnetEmpLoading, lapnetEmpError, lapnetEmpItems);
  if (!list) return;

  lapnetEmpTotal.value = list.length;
  lapnetPage.value = 1;

  if (lapnetStatCardEl.value) {
    gsap.fromTo(lapnetStatCardEl.value, { y: 8 }, { y: 0, duration: 0.28, ease: "power2.out" });
  }
  if (lapnetSideEl.value) {
    gsap.fromTo(lapnetSideEl.value, { y: 8 }, { y: 0, duration: 0.28, ease: "power2.out" });
  }
}

async function fetchNewsTotal() {
  const list = await fetchList(NEWS_API, newsAbortCtrl, newsLoading, newsError, newsItems);
  if (!list) return;
  newsTotal.value = list.length;
  if (newsCardEl.value) gsap.fromTo(newsCardEl.value, { y: 8 }, { y: 0, duration: 0.28, ease: "power2.out" });
  if (newsPreviewEl.value) {
    gsap.fromTo(newsPreviewEl.value, { y: 8 }, { y: 0, duration: 0.28, ease: "power2.out" });
  }
}

async function fetchJobTotal() {
  const list = await fetchList(JOBS_API, jobAbortCtrl, jobLoading, jobError, jobItems);
  if (!list) return;
  jobTotal.value = list.length;
  if (jobsCardEl.value) gsap.fromTo(jobsCardEl.value, { y: 8 }, { y: 0, duration: 0.28, ease: "power2.out" });
}

async function fetchAnnouncementTotal() {
  const list = await fetchList(ANNOUNCE_API, announcementAbortCtrl, announcementLoading, announcementError, announcementItems);
  if (!list) return;
  announcementTotal.value = list.length;
  if (announcementCardEl.value) {
    gsap.fromTo(announcementCardEl.value, { y: 8 }, { y: 0, duration: 0.28, ease: "power2.out" });
  }
}

function refreshAll() {
  fetchMemberTotal();
  fetchBoardTotal();
  fetchLapnetEmpTotal();
  fetchNewsTotal();
  fetchJobTotal();
  fetchAnnouncementTotal();
}

function pick(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== null && v !== undefined && String(v).trim() !== "") return v;
  }
  return "";
}

const searchQuery = ref("");
const showSearchPanel = ref(false);

function openSearch() {
  showSearchPanel.value = true;
}
function closeSearch() {
  showSearchPanel.value = false;
}
function clearSearch() {
  searchQuery.value = "";
  showSearchPanel.value = false;
}

function norm(s) {
  return String(s ?? "").toLowerCase().trim();
}

function flattenText(obj, maxDepth = 2, depth = 0, out = []) {
  if (obj === null || obj === undefined) return out;
  if (depth > maxDepth) return out;

  const t = typeof obj;
  if (t === "string" || t === "number" || t === "boolean") {
    out.push(String(obj));
    return out;
  }

  if (Array.isArray(obj)) {
    for (const it of obj.slice(0, 40)) flattenText(it, maxDepth, depth + 1, out);
    return out;
  }

  if (t === "object") {
    const keys = Object.keys(obj).slice(0, 40);
    for (const k of keys) {
      if (k === "password" || k === "token") continue;
      flattenText(obj[k], maxDepth, depth + 1, out);
    }
    return out;
  }

  return out;
}

function matchObj(obj, q) {
  if (!q) return true;
  const bag = flattenText(obj, 2).join(" ").toLowerCase();
  return bag.includes(q);
}

function mapResult(obj, titleKeys = [], subKeys = [], keyKeys = []) {
  const _title = pick(obj, ...titleKeys) || pick(obj, "title", "name", "header_news", "news_title", "headline") || "-";
  const _sub =
    pick(obj, ...subKeys) ||
    pick(obj, "category", "news_category", "department", "role", "position", "committee", "commitee") ||
    "";
  const _key = pick(obj, ...keyKeys) || pick(obj, "id", "news_id", "emp_id", "director_id", "board_id", "slug") || "";
  return { ...obj, _title: String(_title), _sub: String(_sub), _key: String(_key) };
}

const qNorm = computed(() => norm(searchQuery.value));

const memberMatches = computed(() => {
  if (!qNorm.value) return [];
  return (memberItems.value || [])
    .filter((x) => matchObj(x, qNorm.value))
    .slice(0, 6)
    .map((x) => mapResult(x, ["bank_name", "name", "member_name"], ["type", "category"], ["id"]));
});

const boardMatches = computed(() => {
  if (!qNorm.value) return [];
  return (boardItems.value || [])
    .filter((x) => matchObj(x, qNorm.value))
    .slice(0, 6)
    .map((x) =>
      mapResult(x, ["name", "director_name", "full_name"], ["committee", "commitee", "role", "department"], [
        "id",
        "director_id",
        "board_id",
      ])
    );
});

const newsMatches = computed(() => {
  if (!qNorm.value) return [];
  return (newsItems.value || [])
    .filter((x) => matchObj(x, qNorm.value))
    .slice(0, 6)
    .map((x) => mapResult(x, ["header_news", "news_title", "title", "headline"], ["category", "news_category", "type", "tag"], ["id", "news_id", "slug"]));
});

const jobMatches = computed(() => {
  if (!qNorm.value) return [];
  return (jobItems.value || [])
    .filter((x) => matchObj(x, qNorm.value))
    .slice(0, 6)
    .map((x) => mapResult(x, ["job_title", "title", "position", "name"], ["department", "type", "category"], ["id", "job_id"]));
});

const announceMatches = computed(() => {
  if (!qNorm.value) return [];
  return (announcementItems.value || [])
    .filter((x) => matchObj(x, qNorm.value))
    .slice(0, 6)
    .map((x) => mapResult(x, ["title", "header", "subject", "name"], ["category", "type"], ["id", "announcement_id"]));
});

const lapnetMatches = computed(() => {
  if (!qNorm.value) return [];
  return (lapnetEmpItems.value || [])
    .filter((x) => matchObj(x, qNorm.value))
    .slice(0, 6)
    .map((x) => mapResult(x, ["name", "emp_name", "empName"], ["role", "department", "position"], ["emp_id", "id"]));
});

const searchGroups = computed(() => [
  { key: "members", label: "Members", icon: "fa-solid fa-building-columns", items: memberMatches.value, route: "/members" },
  { key: "board", label: "Board", icon: "fa-solid fa-user-tie", items: boardMatches.value, route: "/Board_directorview" },
  { key: "news", label: "News", icon: "fa-solid fa-newspaper", items: newsMatches.value, route: "/newsviewer" },
  { key: "jobs", label: "Jobs", icon: "fa-solid fa-user-plus", items: jobMatches.value, route: "/jobview" },
  { key: "announcement", label: "Announcement", icon: "fa-solid fa-bullhorn", items: announceMatches.value, route: "/announcementviewer" },
  { key: "lapnet", label: "Employees", icon: "fa-solid fa-users", items: lapnetMatches.value, route: "/lapnetview" },
]);

const searchTotal = computed(() => searchGroups.value.reduce((acc, g) => acc + (g.items?.length || 0), 0));

function goToCategorySearch(path) {
  const q = searchQuery.value?.trim();
  if (q) router.push({ path, query: { q } });
  else router.push(path);
  closeSearch();
}

function onSearchEnter() {
  const q = searchQuery.value?.trim();
  if (!q) return;

  const groups = searchGroups.value.filter((g) => g.items.length);
  if (!groups.length) return;

  goToCategorySearch(groups[0].route);
}

function filterList(list) {
  const q = qNorm.value;
  if (!q) return list || [];
  return (list || []).filter((x) => matchObj(x, q));
}

const NOTIF_KEY = "lapnet_admin_notifications_v1";
const ADMIN_CHAT_SUMMARY_KEY = "lapnet_admin_chat_summary_v1";
const ADMIN_CHAT_SEEN_KEY = "lapnet_admin_chat_seen_v1";
const ADMIN_CHAT_OPEN_TARGET_KEY = "lapnet_admin_chat_open_target_v1";

const notifications = ref([]);
const chatNotifs = ref([]);
let adminChatPollTimer = null;
let adminChatAbortController = null;

function safeJsonParse(value, fallback = null) {
  try {
    const parsed = JSON.parse(String(value));
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function normalizeAdminChatApi(path = "") {
  const clean = String(path || "").trim();
  if (!clean) return VITE_API_BASE_URL;
  if (/^https?:\/\//i.test(clean)) return clean;

  const base = String(VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
  let nextPath = clean.startsWith("/") ? clean : `/${clean}`;
  if (/\/api$/i.test(base) && /^\/api\//i.test(nextPath)) nextPath = nextPath.slice(4);
  return `${base}${nextPath}`;
}

function readAdminChatSeenMap() {
  return safeJsonParse(localStorage.getItem(ADMIN_CHAT_SEEN_KEY), {}) || {};
}

function writeAdminChatSeenMap(map) {
  try {
    localStorage.setItem(ADMIN_CHAT_SEEN_KEY, JSON.stringify(map || {}));
  } catch {}
}

function persistAdminChatSummary(items) {
  try {
    localStorage.setItem(ADMIN_CHAT_SUMMARY_KEY, JSON.stringify(Array.isArray(items) ? items.slice(0, 200) : []));
  } catch {}
}

function toAdminChatTime(value) {
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function buildAdminChatNotifsFromSummary(items) {
  const seenMap = readAdminChatSeenMap();
  return (Array.isArray(items) ? items : []).map((item, index) => {
    const latestAtRaw = item?.last_message_at || item?.last_at || item?.updated_at || null;
    const latestAt = toAdminChatTime(latestAtRaw);
    const seenAt = Number(seenMap[String(item?.conversation_id || item?.bankcode || index)] || 0);
    return {
      id: String(item?.conversation_id || `${item?.bankcode || "chat"}-${index}`),
      conversation_id: Number(item?.conversation_id || 0),
      bankcode: String(item?.bankcode || "Member"),
      from: String(item?.bankcode || "Member"),
      preview: String(item?.last_preview || item?.last_message || ""),
      time: latestAtRaw ? new Date(latestAtRaw).toLocaleString() : "-",
      latestAt,
      unread_count: Number(item?.unread_count || 0),
      read: latestAt > 0 ? seenAt >= latestAt : true,
    };
  });
}

function syncAdminChatNotifsFromStorage() {
  const summary = safeJsonParse(localStorage.getItem(ADMIN_CHAT_SUMMARY_KEY), []);
  chatNotifs.value = buildAdminChatNotifsFromSummary(summary)
    .sort((a, b) => Number(b.latestAt || 0) - Number(a.latestAt || 0));
}

function markAdminChatSeen(conversationIds = []) {
  const ids = Array.isArray(conversationIds) ? conversationIds : [conversationIds];
  const summary = safeJsonParse(localStorage.getItem(ADMIN_CHAT_SUMMARY_KEY), []);
  const seenMap = readAdminChatSeenMap();

  for (const rawId of ids) {
    const id = String(rawId || "").trim();
    if (!id) continue;
    const matched = summary.find((item) => String(item?.conversation_id || "") === id);
    const latestAt = toAdminChatTime(matched?.last_message_at || matched?.last_at || matched?.updated_at || null) || Date.now();
    seenMap[id] = latestAt;
  }

  writeAdminChatSeenMap(seenMap);
  syncAdminChatNotifsFromStorage();
}

async function fetchAdminChatInboxSummary() {
  if (!VITE_API_BASE_URL) return;

  try {
    if (adminChatAbortController) adminChatAbortController.abort();
    adminChatAbortController = new AbortController();

    const headers = { "x-role": "admin" };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const opts = { headers, signal: adminChatAbortController.signal };
    if (FETCH_CREDENTIALS) opts.credentials = FETCH_CREDENTIALS;

    const res = await fetch(normalizeAdminChatApi("/api/chat/admin/banks"), opts);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`chat inbox failed (${res.status})${txt ? `: ${txt}` : ""}`);
    }

    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];

    const normalized = items.map((it, index) => ({
      id: String(it?.conversation_id || `${it?.bankcode || "chat"}-${index}`),
      bankcode: String(it?.bankcode || "Member"),
      conversation_id: Number(it?.conversation_id || it?.id || 0),
      unread_count: Number(it?.unread_count || it?.admin_unread || 0),
      last_preview: String(it?.last_preview || it?.last_message || ""),
      last_message_at: it?.last_message_at || it?.last_at || it?.updated_at || null,
      updated_at: it?.updated_at || null,
    }));

    persistAdminChatSummary(normalized);
    syncAdminChatNotifsFromStorage();
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.warn("[main] fetchAdminChatInboxSummary failed", error);
      syncAdminChatNotifsFromStorage();
    }
  }
}

function startAdminChatPolling() {
  stopAdminChatPolling();
  fetchAdminChatInboxSummary();
  adminChatPollTimer = window.setInterval(fetchAdminChatInboxSummary, 8000);
}

function stopAdminChatPolling() {
  if (adminChatPollTimer) {
    window.clearInterval(adminChatPollTimer);
    adminChatPollTimer = null;
  }
  if (adminChatAbortController) {
    adminChatAbortController.abort();
    adminChatAbortController = null;
  }
}

function loadNotifs() {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr)) notifications.value = arr;
  } catch {}
  if (!notifications.value.length) {
    notifications.value = [
      { id: "n1", title: "System", body: "Dashboard loaded successfully.", time: new Date().toLocaleString(), read: false },
      { id: "n2", title: "Tip", body: "Use the search bar to search everything.", time: new Date().toLocaleString(), read: true },
    ];
  }
}
function persistNotifs() {
  try {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications.value.slice(0, 200)));
  } catch {}
}
watch(notifications, persistNotifs, { deep: true });

const showNotifMenu = ref(false);
const showChatMenu = ref(false);
const showProfileMenu = ref(false);

const notifUnreadCount = computed(() => (notifications.value || []).filter((x) => !x.read).length);
const chatUnreadCount = computed(() => (chatNotifs.value || []).reduce((sum, x) => sum + (!x.read ? Math.max(Number(x.unread_count || 1), 1) : 0), 0));

function toggleNotif() {
  showNotifMenu.value = !showNotifMenu.value;
  showChatMenu.value = false;
  showProfileMenu.value = false;
  if (showNotifMenu.value) closeSearch();
}

function toggleChatMenu() {
  showChatMenu.value = !showChatMenu.value;
  showNotifMenu.value = false;
  showProfileMenu.value = false;
  if (showChatMenu.value) closeSearch();
}

function toggleProfileMenu() {
  showProfileMenu.value = !showProfileMenu.value;
  showNotifMenu.value = false;
  showChatMenu.value = false;
  if (showProfileMenu.value) closeSearch();
}

function markAllNotifRead() {
  notifications.value = (notifications.value || []).map((x) => ({ ...x, read: true }));
  toast("Marked all notifications as read", "ok");
}
function markAllChatRead() {
  markAdminChatSeen((chatNotifs.value || []).map((x) => x.conversation_id || x.id));
  toast("Marked all chat notifications as read", "ok");
}

function openNotification(n) {
  notifications.value = (notifications.value || []).map((x) => (x.id === n.id ? { ...x, read: true } : x));
}

function openChat(c) {
  const conversationId = Number(c?.conversation_id || c?.id || 0);
  if (conversationId) {
    markAdminChatSeen([conversationId]);
    try {
      localStorage.setItem(
        ADMIN_CHAT_OPEN_TARGET_KEY,
        JSON.stringify({
          conversation_id: conversationId,
          bankcode: String(c?.bankcode || c?.from || "").trim(),
          at: Date.now(),
        })
      );
    } catch {}
  }
  goChat();
}

const adminName = computed(() => {
  try {
    return localStorage.getItem("admin_name") || "Admin";
  } catch {
    return "Admin";
  }
});
const adminRole = computed(() => {
  try {
    return localStorage.getItem("admin_role") || "Administrator";
  } catch {
    return "Administrator";
  }
});


function handleAdminChatStorageSync(event) {
  if (!event || !event.key) return;
  if ([ADMIN_CHAT_SUMMARY_KEY, ADMIN_CHAT_SEEN_KEY].includes(event.key)) {
    syncAdminChatNotifsFromStorage();
  }
}
const adminAvatar = computed(() => {
  try {
    return localStorage.getItem("admin_avatar") || "";
  } catch {
    return "";
  }
});
const adminInitials = computed(() => {
  const n = String(adminName.value || "A").trim();
  const parts = n.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "A";
  const b = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1] || "";
  return (a + b).toUpperCase();
});

function onDocClick(e) {
  const t = e.target;
  const inside = (el) => el && (el === t || el.contains(t));

  const inSearch = inside(searchWrapEl.value);
  const inNotif = inside(notifWrapEl.value);
  const inChat = inside(chatWrapEl.value);
  const inProfile = inside(profileWrapEl.value);

  if (!inSearch) showSearchPanel.value = false;
  if (!inNotif) showNotifMenu.value = false;
  if (!inChat) showChatMenu.value = false;
  if (!inProfile) showProfileMenu.value = false;
}

const ranges = [
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "3m", label: "3M", days: 90 },
];

const categories = [
  { key: "all", label: "Overview" },
  { key: "bank", label: "Bank" },
  { key: "news", label: "News" },
  { key: "jobs", label: "Jobs" },
  { key: "announcement", label: "Announcement" },
];

const rangeKey = ref("7d");
const categoryKey = ref("all");

function setRange(k) {
  rangeKey.value = k;
}
function setCategory(k) {
  categoryKey.value = k;
}

const dateCache = new WeakMap();
function parseAnyDate(obj) {
  if (!obj) return null;
  if (typeof obj === "object" && dateCache.has(obj)) return dateCache.get(obj);

  const tryParse = (v) => {
    if (v === null || v === undefined) return null;

    if (typeof v === "number") {
      const ms = v > 1e12 ? v : v * 1000;
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    if (typeof v === "string") {
      const s = v.trim();
      if (!s) return null;

      if (/^\d{10,13}$/.test(s)) {
        const n = Number(s);
        const ms = n > 1e12 ? n : n * 1000;
        const d = new Date(ms);
        return Number.isNaN(d.getTime()) ? null : d;
      }

      const t = Date.parse(s);
      if (!Number.isNaN(t)) return new Date(t);
      return null;
    }

    return null;
  };

  const direct = tryParse(obj);
  if (direct) {
    if (typeof obj === "object") dateCache.set(obj, direct);
    return direct;
  }

  const fields = [
    "createdAt",
    "created_at",
    "create_at",
    "created",
    "date_time",
    "dateTime",
    "date",
    "timestamp",
    "time",
    "postedAt",
    "publish_date",
    "publishedAt",
    "updatedAt",
  ];

  for (const f of fields) {
    const d = tryParse(obj?.[f]);
    if (d) {
      if (typeof obj === "object") dateCache.set(obj, d);
      return d;
    }
  }

  if (typeof obj === "object") dateCache.set(obj, null);
  return null;
}

function sortByDateDesc(list) {
  const arr = Array.isArray(list) ? list.slice() : [];
  arr.sort((a, b) => {
    const da = parseAnyDate(a)?.getTime() ?? -1;
    const db = parseAnyDate(b)?.getTime() ?? -1;
    return db - da;
  });
  return arr;
}

function toKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}
const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "short" });
function fmtLabel(d) {
  const mm = MONTH_FMT.format(d);
  return `${mm} ${d.getDate()}`;
}
function buildDays(nDays) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const out = [];
  for (let i = nDays - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    out.push({ key: toKey(d), label: fmtLabel(d), date: d });
  }
  return out;
}
function buildSeriesAgg(list, daysArr) {
  const map = new Map(daysArr.map((d) => [d.key, 0]));
  let unknown = 0;

  for (const item of list || []) {
    const dt = parseAnyDate(item);
    if (!dt) {
      unknown++;
      continue;
    }
    const day = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const k = toKey(day);
    if (map.has(k)) map.set(k, (map.get(k) || 0) + 1);
  }

  const series = daysArr.map((d) => ({ key: d.key, label: d.label, count: map.get(d.key) || 0 }));
  return { series, unknown };
}

const rangeDays = computed(() => ranges.find((r) => r.key === rangeKey.value)?.days ?? 7);
const rangeLabel = computed(() => ranges.find((r) => r.key === rangeKey.value)?.label ?? "7D");
const categoryLabel = computed(() => categories.find((c) => c.key === categoryKey.value)?.label ?? "Overview");

const days = computed(() => buildDays(rangeDays.value));

const memberAgg = computed(() => buildSeriesAgg(memberItems.value, days.value));
const newsAgg = computed(() => buildSeriesAgg(newsItems.value, days.value));
const jobAgg = computed(() => buildSeriesAgg(jobItems.value, days.value));
const announcementAgg = computed(() => buildSeriesAgg(announcementItems.value, days.value));

const memberSeries = computed(() => memberAgg.value.series);
const newsSeries = computed(() => newsAgg.value.series);
const jobSeries = computed(() => jobAgg.value.series);
const announcementSeries = computed(() => announcementAgg.value.series);

const totalSeries = computed(() =>
  days.value.map((d, i) => ({
    key: d.key,
    label: d.label,
    count:
      (memberSeries.value[i]?.count ?? 0) +
      (newsSeries.value[i]?.count ?? 0) +
      (jobSeries.value[i]?.count ?? 0) +
      (announcementSeries.value[i]?.count ?? 0),
  }))
);

const activeSeries = computed(() => {
  switch (categoryKey.value) {
    case "bank":
      return memberSeries.value;
    case "news":
      return newsSeries.value;
    case "jobs":
      return jobSeries.value;
    case "announcement":
      return announcementSeries.value;
    default:
      return totalSeries.value;
  }
});

const anyLoading = computed(() => memberLoading.value || newsLoading.value || jobLoading.value || announcementLoading.value);
const anyError = computed(() => memberError.value || newsError.value || jobError.value || announcementError.value || "");

const unknownDateCount = computed(() => {
  if (anyLoading.value || anyError.value) return 0;
  if (categoryKey.value === "bank") return memberAgg.value.unknown;
  if (categoryKey.value === "news") return newsAgg.value.unknown;
  if (categoryKey.value === "jobs") return jobAgg.value.unknown;
  if (categoryKey.value === "announcement") return announcementAgg.value.unknown;
  return memberAgg.value.unknown + newsAgg.value.unknown + jobAgg.value.unknown + announcementAgg.value.unknown;
});

const rangeTotal = computed(() => {
  const s = categoryKey.value === "all" ? totalSeries.value : activeSeries.value;
  return s.reduce((acc, x) => acc + (x?.count ?? 0), 0);
});

const avgPerDay = computed(() => {
  const d = rangeDays.value;
  const v = d ? rangeTotal.value / d : 0;
  return v.toFixed(1);
});

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
function rgba(hex, a = 1) {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return `rgba(255,255,255,${a})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function palette() {
  return {
    txt: cssVar("--txt", "rgba(255,255,255,0.92)"),
    muted: cssVar("--muted", "rgba(255,255,255,0.58)"),
    stroke: cssVar("--stroke", "rgba(255,255,255,0.08)"),
    bank: "#F2FF00",
    news: "#6366F1",
    jobs: "#0EA5E9",
    announcement: "#22C55E",
    total: "#FFFFFF",
  };
}

function destroyChart() {
  if (chartInst) {
    chartInst.destroy();
    chartInst = null;
  }
}

function buildDatasets(ctx) {
  const p = palette();

  const labels = days.value.map((d) => d.label);
  const bank = memberSeries.value.map((x) => x.count || 0);
  const news = newsSeries.value.map((x) => x.count || 0);
  const jobs = jobSeries.value.map((x) => x.count || 0);
  const ann = announcementSeries.value.map((x) => x.count || 0);
  const total = totalSeries.value.map((x) => x.count || 0);

  const makeFill = (colorHex) => {
    const g = ctx.createLinearGradient(0, 0, 0, 260);
    g.addColorStop(0, rgba(colorHex, 0.26));
    g.addColorStop(1, rgba(colorHex, 0.02));
    return g;
  };

  if (categoryKey.value === "all") {
    return {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Bank", data: bank, backgroundColor: rgba(p.bank, 0.18), borderColor: rgba(p.bank, 0.28), borderWidth: 1, borderRadius: 12, borderSkipped: false, stack: "s" },
          { label: "News", data: news, backgroundColor: rgba(p.news, 0.18), borderColor: rgba(p.news, 0.28), borderWidth: 1, borderRadius: 12, borderSkipped: false, stack: "s" },
          { label: "Jobs", data: jobs, backgroundColor: rgba(p.jobs, 0.16), borderColor: rgba(p.jobs, 0.26), borderWidth: 1, borderRadius: 12, borderSkipped: false, stack: "s" },
          { label: "Announcement", data: ann, backgroundColor: rgba(p.announcement, 0.16), borderColor: rgba(p.announcement, 0.26), borderWidth: 1, borderRadius: 12, borderSkipped: false, stack: "s" },
          {
            type: "line",
            label: "Total",
            data: total,
            borderColor: rgba(p.total, 0.85),
            backgroundColor: makeFill(p.total),
            fill: true,
            tension: 0.35,
            pointRadius: 2,
            pointHoverRadius: 5,
            borderWidth: 2,
            order: 0,
          },
        ],
      },
    };
  }

  const active = activeSeries.value.map((x) => x.count || 0);
  const colorHex =
    categoryKey.value === "bank"
      ? p.bank
      : categoryKey.value === "news"
        ? p.news
        : categoryKey.value === "jobs"
          ? p.jobs
          : p.announcement;

  return {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: categoryLabel.value,
          data: active,
          borderColor: rgba(colorHex, 0.9),
          backgroundColor: makeFill(colorHex),
          fill: true,
          tension: 0.38,
          pointRadius: 2,
          pointHoverRadius: 5,
          borderWidth: 2.5,
        },
      ],
    },
  };
}

function renderOrUpdateChart() {
  if (!chartCanvasEl.value) return;
  if (anyLoading.value || anyError.value) return;

  const ctx = chartCanvasEl.value.getContext("2d");
  if (!ctx) return;

  const p = palette();
  const cfg = buildDatasets(ctx);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(7, 14, 35, 0.92)",
        borderColor: p.stroke,
        borderWidth: 1,
        titleColor: p.txt,
        bodyColor: p.txt,
        padding: 10,
        displayColors: true,
      },
    },
    scales: {
      x: {
        stacked: categoryKey.value === "all",
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: p.muted, maxRotation: 0, autoSkip: true },
      },
      y: {
        stacked: categoryKey.value === "all",
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: p.muted, precision: 0 },
        beginAtZero: true,
      },
    },
    elements: { line: { capBezierPoints: true } },
  };

  if (!chartInst) {
    chartInst = new Chart(ctx, { type: cfg.type, data: cfg.data, options });
  } else {
    chartInst.config.type = cfg.type;
    chartInst.data.labels = cfg.data.labels;
    chartInst.data.datasets = cfg.data.datasets;
    chartInst.options = options;
    chartInst.update();
  }

  if (chartCardEl.value) gsap.fromTo(chartCardEl.value, { y: 8 }, { y: 0, duration: 0.22, ease: "power2.out" });
}

watch([rangeKey, categoryKey, anyLoading, anyError], async () => {
  if (anyLoading.value || anyError.value) return;
  await nextTick();
  renderOrUpdateChart();
});

const lapnetSorted = computed(() => (Array.isArray(lapnetEmpItems.value) ? lapnetEmpItems.value.slice() : []));
const lapnetPage = ref(1);
const lapnetPageSize = 3;
const lapnetStartIndex = computed(() => (lapnetPage.value - 1) * lapnetPageSize);

const lapnetFiltered = computed(() => filterList(lapnetSorted.value));
const lapnetPageCountFiltered = computed(() => Math.max(1, Math.ceil((lapnetFiltered.value?.length || 0) / lapnetPageSize)));

const lapnetFilteredPaged = computed(() => {
  const list = lapnetFiltered.value || [];
  const start = (lapnetPage.value - 1) * lapnetPageSize;
  return list.slice(start, start + lapnetPageSize);
});

function lapnetPrev() {
  lapnetPage.value = Math.max(1, lapnetPage.value - 1);
}
function lapnetNextFiltered() {
  lapnetPage.value = Math.min(lapnetPageCountFiltered.value, lapnetPage.value + 1);
}

watch(
  () => lapnetFiltered.value.length,
  () => {
    const max = lapnetPageCountFiltered.value;
    if (lapnetPage.value > max) lapnetPage.value = max || 1;
    if (lapnetPage.value < 1) lapnetPage.value = 1;
  }
);

watch(qNorm, () => {
  lapnetPage.value = 1;
});

const boardLatest = computed(() => sortByDateDesc(boardItems.value));
const boardFiltered = computed(() => filterList(boardLatest.value));

const boardPage = ref(1);
const boardPageSize = 4;

const boardPageCountFiltered = computed(() => Math.max(1, Math.ceil((boardFiltered.value?.length || 0) / boardPageSize)));

const boardFilteredPaged = computed(() => {
  const list = boardFiltered.value || [];
  const start = (boardPage.value - 1) * boardPageSize;
  return list.slice(start, start + boardPageSize);
});

function boardPrev() {
  boardPage.value = Math.max(1, boardPage.value - 1);
}
function boardNextFiltered() {
  boardPage.value = Math.min(boardPageCountFiltered.value, boardPage.value + 1);
}

watch(
  () => boardFiltered.value.length,
  () => {
    const max = boardPageCountFiltered.value;
    if (boardPage.value > max) boardPage.value = max || 1;
    if (boardPage.value < 1) boardPage.value = 1;
  }
);

watch(qNorm, () => {
  boardPage.value = 1;
});

const newsLatest = computed(() => sortByDateDesc(newsItems.value));
const newsFilteredLatest = computed(() => filterList(newsLatest.value));
const newsFilteredPreview = computed(() => (newsFilteredLatest.value || []).slice(0, 6));

function newsThumbSrc(n) {
  const raw =
    pick(
      n,
      "hero_img",
      "heroImg",
      "hero_image",
      "heroImage",
      "cover",
      "cover_image",
      "coverImage",
      "thumbnail",
      "thumb",
      "image",
      "image_url",
      "imageUrl",
      "news_image",
      "newsImage",
      "image_path",
      "imagePath",
      "photo"
    ) || "";

  return resolveImageUrl(raw, VITE_API_BASE_URL);
}

function fmtDateTime(d) {
  if (!d) return "";
  try {
    const f = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    return f.format(d);
  } catch {
    return String(d);
  }
}

const CAL_STORAGE_KEY = "lapnet_admin_calendar_events_v1";
const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const nowCal = new Date();
const calMonth = ref(nowCal.getMonth());
const calYear = ref(nowCal.getFullYear());
const selectedDateKey = ref(toKey(nowCal));
const todayKey = toKey(nowCal);

const calEvents = ref([]);
const calLoaded = ref(false);

function loadCalendar() {
  try {
    const raw = localStorage.getItem(CAL_STORAGE_KEY);
    if (!raw) {
      calEvents.value = [];
      return;
    }
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      calEvents.value = [];
      return;
    }
    calEvents.value = data
      .filter((x) => x && typeof x === "object" && typeof x.dateKey === "string" && typeof x.title === "string")
      .slice(0, 3000);
  } catch {
    calEvents.value = [];
  }
}

function persistCalendar() {
  if (!calLoaded.value) return;
  try {
    localStorage.setItem(CAL_STORAGE_KEY, JSON.stringify(calEvents.value));
  } catch {}
}
watch(calEvents, persistCalendar, { deep: true });

function selectDay(key) {
  if (!key) return;
  selectedDateKey.value = key;
}

function hasEvents(key) {
  if (!key) return false;
  return (calEvents.value || []).some((e) => e.dateKey === key);
}

const dayEvents = computed(() =>
  (calEvents.value || [])
    .filter((e) => e.dateKey === selectedDateKey.value)
    .slice()
    .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")))
);

const calMonthLabel = computed(() => {
  try {
    return new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(calYear.value, calMonth.value, 1));
  } catch {
    return "Month";
  }
});

function buildCalCells(y, m) {
  const first = new Date(y, m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const out = [];
  for (let i = 0; i < startDow; i++) {
    out.push({ blank: true, key: `b-${y}-${m}-${i}`, day: "" });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(y, m, d);
    out.push({ blank: false, key: toKey(dt), day: d });
  }

  while (out.length % 7 !== 0) out.push({ blank: true, key: `t-${y}-${m}-${out.length}`, day: "" });
  return out;
}

const calCells = computed(() => buildCalCells(calYear.value, calMonth.value));

function prevMonth() {
  const m = calMonth.value - 1;
  if (m < 0) {
    calMonth.value = 11;
    calYear.value -= 1;
  } else {
    calMonth.value = m;
  }
}
function nextMonth() {
  const m = calMonth.value + 1;
  if (m > 11) {
    calMonth.value = 0;
    calYear.value += 1;
  } else {
    calMonth.value = m;
  }
}
function jumpToday() {
  const d = new Date();
  calMonth.value = d.getMonth();
  calYear.value = d.getFullYear();
  selectedDateKey.value = toKey(d);
  toast("Jumped to today", "info");
}

const newEventTitle = ref("");
const newEventTime = ref("");
const newEventNote = ref("");

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function addCalEvent() {
  const title = newEventTitle.value.trim();
  if (!title) return;

  const ev = {
    id: uid(),
    dateKey: selectedDateKey.value,
    title,
    time: newEventTime.value.trim(),
    note: newEventNote.value.trim(),
    createdAt: new Date().toISOString(),
  };

  calEvents.value = [ev, ...(calEvents.value || [])];
  newEventTitle.value = "";
  newEventTime.value = "";
  newEventNote.value = "";
  toast("Saved event", "ok");
}

function clearDayEvents() {
  if (!dayEvents.value.length) return;
  calEvents.value = (calEvents.value || []).filter((e) => e.dateKey !== selectedDateKey.value);
  toast("Cleared day events", "ok");
}

const confirmOpen = ref(false);
const confirmTarget = ref(null);

function askDeleteEvent(ev) {
  confirmTarget.value = ev;
  confirmOpen.value = true;
}
function closeConfirm() {
  confirmOpen.value = false;
  confirmTarget.value = null;
}
function confirmDelete() {
  const target = confirmTarget.value;
  if (!target) return closeConfirm();
  calEvents.value = (calEvents.value || []).filter((e) => e.id !== target.id);
  toast("Deleted event", "ok");
  closeConfirm();
}

const toasts = ref([]);
function toast(msg, type = "info") {
  const id = uid();
  const icon =
    type === "ok"
      ? "fa-solid fa-circle-check"
      : type === "danger"
        ? "fa-solid fa-triangle-exclamation"
        : "fa-solid fa-circle-info";

  const item = { id, msg, type, icon };
  toasts.value = [item, ...toasts.value].slice(0, 5);

  nextTick(() => {
    const el = document.querySelector(".toastWrap .toast:nth-child(1)");
    if (el) gsap.fromTo(el, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.22, ease: "power2.out" });
  });

  setTimeout(() => {
    toasts.value = (toasts.value || []).filter((t) => t.id !== id);
  }, 3200);
}

function cardHover(e, enter) {
  gsap.to(e.currentTarget, { y: enter ? -3 : 0, duration: 0.22, ease: "power2.out" });
}

onMounted(async () => {
  document.addEventListener("click", onDocClick, true);
  window.addEventListener("storage", handleAdminChatStorageSync);

  const els = dashEl.value?.querySelectorAll?.(".js-reveal") || [];
  gsap.set(els, { opacity: 0, y: 12 });
  gsap.to(els, { opacity: 1, y: 0, stagger: 0.06, duration: 0.42, ease: "power3.out" });

  loadNotifs();
  syncAdminChatNotifsFromStorage();
  startAdminChatPolling();

  loadCalendar();
  calLoaded.value = true;

  refreshAll();

  await nextTick();
  renderOrUpdateChart();
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick, true);
  window.removeEventListener("storage", handleAdminChatStorageSync);
  stopAdminChatPolling();

  memberAbortCtrl.value?.abort?.();
  boardAbortCtrl.value?.abort?.();
  lapnetEmpAbortCtrl.value?.abort?.();
  newsAbortCtrl.value?.abort?.();
  jobAbortCtrl.value?.abort?.();
  announcementAbortCtrl.value?.abort?.();

  destroyChart();
});
</script>

<style scoped>
.dash {
  width: 100%;
}

.dashTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 2px 0 12px;
  position: relative;
  z-index: 9999;
}

.topActions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.topRefresh {
  width: 40px;
  height: 40px;
}

.searchWrap {
  position: relative;
  flex: 1;
  max-width: 740px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.22);
}

.searchIcon {
  color: rgba(255, 255, 255, 0.65);
  font-size: 14px;
}

.searchInput {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  font-weight: 900;
  font-size: 13px;
}

.searchInput::placeholder {
  color: rgba(255, 255, 255, 0.45);
  font-weight: 850;
}

.searchClear {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
}
.searchClear:hover {
  border-color: rgba(56, 189, 248, 0.18);
  color: rgba(255, 255, 255, 0.92);
  transform: translateY(-1px);
}

.searchPanel {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  right: 0;
  z-index: 9999;
  border-radius: 18px;
  padding: 12px;
  background: rgba(8, 14, 34, 0.92);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
  max-height: 420px;
  overflow: auto;
}

.searchPanelTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.searchPanelTitle {
  color: rgba(255, 255, 255, 0.82);
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.searchPanelMeta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.pillMini {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.75);
  font-weight: 900;
  font-size: 12px;
}

.pillBtn {
  height: 34px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.82);
  font-weight: 900;
  font-size: 12px;
  cursor: pointer;
}
.pillBtn:hover {
  border-color: rgba(56, 189, 248, 0.18);
  transform: translateY(-1px);
}

.searchEmpty {
  margin-top: 12px;
  padding: 12px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.7);
  font-weight: 850;
}

.searchGroups {
  margin-top: 10px;
  display: grid;
  gap: 10px;
}

.searchGroup {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  overflow: hidden;
}

.searchGroupHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.searchGroupTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 950;
  font-size: 12px;
}

.groupCount {
  margin-left: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.18);
  background: rgba(56, 189, 248, 0.06);
  color: rgba(255, 255, 255, 0.88);
  font-weight: 950;
}

.seeAllBtn {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.85);
  border-radius: 999px;
  padding: 8px 10px;
  font-weight: 950;
  font-size: 12px;
  cursor: pointer;
}
.seeAllBtn:hover {
  border-color: rgba(56, 189, 248, 0.18);
  transform: translateY(-1px);
}

.searchItems {
  padding: 8px;
  display: grid;
  gap: 8px;
}

.searchItem {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  text-align: left;
  padding: 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
}
.searchItem:hover {
  border-color: rgba(56, 189, 248, 0.18);
  transform: translateY(-1px);
}

.searchItemTitle {
  font-weight: 950;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.92);
}

.searchItemSub {
  margin-top: 2px;
  font-weight: 850;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.62);
}

.searchPanelHint {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.58);
  font-weight: 850;
  font-size: 12px;
}

.menuWrap {
  position: relative;
}

.iconBtn {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.82);
  cursor: pointer;
  position: relative;
}
.iconBtn:hover {
  border-color: rgba(56, 189, 248, 0.18);
  color: rgba(255, 255, 255, 0.92);
  transform: translateY(-1px);
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(239, 68, 68, 0.95);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 950;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.profileBtn {
  height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px 0 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  font-weight: 950;
}
.profileBtn:hover {
  border-color: rgba(56, 189, 248, 0.18);
  transform: translateY(-1px);
}

.profileName {
  font-size: 12px;
  font-weight: 950;
  color: rgba(255, 255, 255, 0.9);
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
  display: grid;
  place-items: center;
}
.avatar.big {
  width: 44px;
  height: 44px;
  border-radius: 16px;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatarTxt {
  font-size: 12px;
  font-weight: 950;
  color: rgba(255, 255, 255, 0.9);
}

.menuPanel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 9999;
  width: 320px;
  border-radius: 18px;
  padding: 12px;
  background: rgba(8, 14, 34, 0.92);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
}

.menuTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.menuTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 950;
  color: rgba(255, 255, 255, 0.9);
}

.menuBtn {
  height: 32px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.85);
  font-weight: 950;
  font-size: 12px;
  cursor: pointer;
}
.menuBtn:hover {
  border-color: rgba(56, 189, 248, 0.18);
  transform: translateY(-1px);
}

.menuEmpty {
  margin-top: 10px;
  padding: 12px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.7);
  font-weight: 850;
}

.menuList {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}

.menuItem {
  width: 100%;
  text-align: left;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
}
.menuItem:hover {
  border-color: rgba(56, 189, 248, 0.18);
  transform: translateY(-1px);
}
.menuItem.unread {
  border-color: rgba(56, 189, 248, 0.18);
  background: rgba(56, 189, 248, 0.06);
}

.menuItemMain {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.menuItemTitle {
  font-weight: 950;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.menuItemBody {
  font-weight: 850;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.68);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.menuItemTime {
  margin-top: 2px;
  font-weight: 850;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.9);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.12);
  margin-top: 4px;
  flex: 0 0 auto;
}

.menuFoot {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}
.menuLink {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.86);
  border-radius: 999px;
  padding: 8px 10px;
  font-weight: 950;
  font-size: 12px;
  cursor: pointer;
}
.menuLink:hover {
  border-color: rgba(56, 189, 248, 0.18);
  transform: translateY(-1px);
}

.profileTop {
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.profileBig {
  display: flex;
  align-items: center;
  gap: 10px;
}
.profileBigName {
  font-weight: 950;
  color: rgba(255, 255, 255, 0.92);
}
.profileBigSub {
  margin-top: 2px;
  font-size: 12px;
  font-weight: 850;
  color: rgba(255, 255, 255, 0.65);
}

.menuAction {
  align-items: center;
  gap: 10px;
}
.menuAction i {
  width: 18px;
  opacity: 0.9;
}
.menuAction.danger {
  border-color: rgba(239, 68, 68, 0.2);
}
.menuAction.danger:hover {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.08);
}

.subSearchTag {
  font-weight: 950;
  color: rgba(56, 189, 248, 0.9);
}

.statGrid {
  --sideBlockMaxH: 430px;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 12px;
  padding: 6px 0 14px;
}

.statCard,
.chartCard,
.calendarCard,
.sideCard {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  padding: 14px 14px 12px;
  background: var(--glass, rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(12px);
}

.statCard {
  grid-column: span 3;
  transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease, transform 180ms ease;
}
.statCard.wide {
  grid-column: span 6;
}

.statCard:hover {
  border-color: rgba(56, 189, 248, 0.2);
  background: rgba(255, 255, 255, 0.045);
  box-shadow: 0 22px 56px rgba(56, 189, 248, 0.08);
  transform: translateY(-1px);
}

.statGlow {
  position: absolute;
  inset: -2px;
  pointer-events: none;
  background: radial-gradient(circle at 22% 18%, rgba(56, 189, 248, 0.18), transparent 58%),
    radial-gradient(circle at 82% 28%, rgba(99, 102, 241, 0.14), transparent 62%);
  opacity: 0.85;
  filter: blur(14px);
}

.cardSheen {
  position: absolute;
  inset: -2px;
  pointer-events: none;
  background: linear-gradient(
    115deg,
    rgba(255, 255, 255, 0) 25%,
    rgba(255, 255, 255, 0.08) 45%,
    rgba(255, 255, 255, 0) 70%
  );
  transform: translateX(-40%);
  opacity: 0.12;
  animation: sheen 5.5s ease-in-out infinite;
}

@keyframes sheen {
  0% { transform: translateX(-60%); }
  55% { transform: translateX(60%); }
  100% { transform: translateX(60%); }
}

.statTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.statIcon {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(99, 102, 241, 0.14));
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
}

.statRefresh {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.78);
  cursor: pointer;
}
.statRefresh:hover {
  border-color: rgba(56, 189, 248, 0.18);
  color: rgba(255, 255, 255, 0.92);
}

.statLabel {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 800;
  letter-spacing: 0.3px;
  position: relative;
  z-index: 1;
}

.statValue {
  margin-top: 6px;
  font-size: 30px;
  font-weight: 950;
  letter-spacing: 0.2px;
  position: relative;
  z-index: 1;
}

.statHint {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.48);
  position: relative;
  z-index: 1;
  font-weight: 850;
}

.statError {
  font-size: 14px;
  font-weight: 850;
  color: rgba(239, 68, 68, 0.95);
}

.loadingWrap {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 850;
  color: rgba(255, 255, 255, 0.7);
}

.spinner {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.18);
  border-top-color: rgba(56, 189, 248, 0.7);
  animation: spin 0.85s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.leftCol {
  grid-column: span 8;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chartCard {
  width: 100%;
  --chartH: 270px;
  background: rgba(255, 255, 255, 0.028);
  border-color: rgba(255, 255, 255, 0.08);
}

.chartGlow {
  position: absolute;
  inset: -2px;
  pointer-events: none;
  background: radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.14), transparent 58%),
    radial-gradient(circle at 82% 30%, rgba(99, 102, 241, 0.12), transparent 62%);
  opacity: 0.9;
  filter: blur(14px);
}

.chartTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.chartTitle {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.chartBadge {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(99, 102, 241, 0.14));
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
}

.chartH {
  font-weight: 950;
  letter-spacing: 0.2px;
}

.chartSub {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 850;
}

.chartActions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.segmented {
  display: inline-flex;
  gap: 6px;
  padding: 6px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.segBtn {
  height: 32px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.78);
  font-weight: 950;
  cursor: pointer;
  transition: transform 140ms ease, border-color 160ms ease, background 160ms ease, color 160ms ease;
}
.segBtn:hover {
  border-color: rgba(56, 189, 248, 0.18);
  color: rgba(255, 255, 255, 0.92);
  transform: translateY(-1px);
}
.segBtn.active {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.12));
  border-color: rgba(56, 189, 248, 0.22);
  color: rgba(255, 255, 255, 0.95);
}

.chartRefreshBtn {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  transition: transform 140ms ease;
}
.chartRefreshBtn:hover {
  border-color: rgba(56, 189, 248, 0.18);
  color: rgba(255, 255, 255, 0.92);
  transform: translateY(-1px);
}

.chipRow {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.86);
  font-weight: 950;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}
.chip:hover {
  transform: translateY(-1px);
  border-color: rgba(56, 189, 248, 0.22);
  background: rgba(255, 255, 255, 0.03);
}
.chip.active {
  border-color: rgba(56, 189, 248, 0.28);
  background: rgba(56, 189, 248, 0.06);
}

.chipDot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.12);
  flex: 0 0 auto;
}

.chipText {
  font-size: 12px;
  font-weight: 950;
}

.chip.bank .chipDot { background: rgba(242, 255, 0, 0.9); box-shadow: 0 0 0 6px rgba(242, 255, 0, 0.12); }
.chip.news .chipDot { background: rgba(99, 102, 241, 0.9); box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.12); }
.chip.jobs .chipDot { background: rgba(14, 165, 233, 0.9); box-shadow: 0 0 0 6px rgba(14, 165, 233, 0.12); }
.chip.announcement .chipDot { background: rgba(34, 197, 94, 0.9); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.12); }
.chip.all .chipDot { background: rgba(255, 255, 255, 0.8); box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.08); }

.chartMeta {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.metaPill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--panel2, rgba(255,255,255,0.02));
  border: 1px solid var(--stroke, rgba(255,255,255,0.08));
  color: rgba(255, 255, 255, 0.78);
  font-weight: 850;
}
.metaPill.subtle { opacity: 0.85; }

.errorPill {
  border-color: rgba(239, 68, 68, 0.25);
  color: rgba(239, 68, 68, 0.95);
}

.chartCanvasWrap {
  margin-top: 12px;
  position: relative;
  z-index: 1;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: radial-gradient(circle at 25% 20%, rgba(56, 189, 248, 0.08), transparent 55%),
    radial-gradient(circle at 80% 25%, rgba(99, 102, 241, 0.06), transparent 58%),
    rgba(255, 255, 255, 0.015);
  overflow: hidden;
  height: var(--chartH);
}

.chartCanvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}

.chartOverlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 900;
  background: rgba(7, 14, 35, 0.55);
  backdrop-filter: blur(10px);
}
.chartOverlay.error {
  color: rgba(239, 68, 68, 0.95);
  background: rgba(7, 14, 35, 0.65);
}

.legend {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  align-items: center;
  position: relative;
  z-index: 1;
}

.legItem {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.78);
  font-weight: 900;
  font-size: 12px;
}

.legDot { width: 10px; height: 10px; border-radius: 999px; }
.legDot.total { background: rgba(255, 255, 255, 0.85); }
.legDot.bank { background: rgba(242, 255, 0, 0.9); }
.legDot.news { background: rgba(99, 102, 241, 0.9); }
.legDot.jobs { background: rgba(14, 165, 233, 0.9); }
.legDot.announcement { background: rgba(34, 197, 94, 0.9); }

.legHint {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.58);
  font-weight: 850;
  font-size: 12px;
}

.sideCol {
  grid-column: span 4;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sideCard {
  background: rgba(255, 255, 255, 0.024);
  border-color: rgba(255, 255, 255, 0.08);
}

.sideGlow {
  position: absolute;
  inset: -2px;
  pointer-events: none;
  background: radial-gradient(circle at 22% 18%, rgba(56, 189, 248, 0.12), transparent 58%),
    radial-gradient(circle at 82% 28%, rgba(99, 102, 241, 0.1), transparent 62%);
  opacity: 0.85;
  filter: blur(14px);
}

.sideTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.sideTitle {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.sideBadge {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(99, 102, 241, 0.14));
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
}

.sideH {
  font-weight: 950;
  letter-spacing: 0.2px;
}

.sideSub {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 850;
}

.sideRefresh {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.78);
  cursor: pointer;
}
.sideRefresh:hover {
  border-color: rgba(56, 189, 248, 0.18);
  color: rgba(255, 255, 255, 0.92);
  transform: translateY(-1px);
}

.sideMeta {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.metaMini {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.78);
  font-weight: 900;
  font-size: 12px;
}

.sideLink {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.86);
  border-radius: 999px;
  padding: 8px 10px;
  font-weight: 950;
  font-size: 12px;
  cursor: pointer;
}
.sideLink:hover {
  border-color: rgba(56, 189, 248, 0.18);
  transform: translateY(-1px);
}

.sideBody {
  margin-top: 10px;
  position: relative;
  z-index: 1;
}

.sideState {
  padding: 12px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-weight: 850;
  display: flex;
  align-items: center;
  gap: 10px;
}
.sideState.errState {
  border-color: rgba(239, 68, 68, 0.25);
  color: rgba(239, 68, 68, 0.95);
}

.miniChip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.18);
  background: rgba(56, 189, 248, 0.06);
  color: rgba(255, 255, 255, 0.86);
  font-weight: 900;
  font-size: 11px;
}
.miniChip.subtle {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.7);
}

.sideList { display: grid; gap: 10px; }

.sideItem {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}
.sideItem:hover {
  transform: translateY(-1px);
  border-color: rgba(56, 189, 248, 0.18);
  background: rgba(255, 255, 255, 0.03);
}

.sideAvatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.18);
  display: grid;
  place-items: center;
}
.sideAvatar img { width: 100%; height: 100%; object-fit: cover; }
.sideAvatarEmpty { color: rgba(255, 255, 255, 0.7); font-size: 14px; }

.sideInfo { display: flex; flex-direction: column; gap: 4px; }

.sideName {
  font-weight: 950;
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.empNoChip { padding: 4px 8px; }

.sideRole { font-weight: 850; color: rgba(255, 255, 255, 0.68); font-size: 12px; }
.sideChips { display: flex; flex-wrap: wrap; gap: 6px; }

.sideCard.boardCard { background: rgba(255, 255, 255, 0.026); border-color: rgba(255, 255, 255, 0.09); }

.boardHero {
  position: absolute;
  inset: -2px -2px auto -2px;
  height: 86px;
  pointer-events: none;
  background: radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.18), transparent 58%),
    radial-gradient(circle at 75% 20%, rgba(56, 189, 248, 0.14), transparent 62%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0));
  opacity: 0.9;
}

.boardList { display: grid; gap: 10px; }

.boardItem {
  display: grid;
  grid-template-columns: 52px 1fr 18px;
  gap: 10px;
  align-items: center;
  padding: 10px 10px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.085);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}
.boardItem:hover {
  transform: translateY(-1px);
  border-color: rgba(99, 102, 241, 0.22);
  background: rgba(255, 255, 255, 0.03);
}

.boardLogo {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  display: grid;
  place-items: center;
}
.boardLogo img { width: 100%; height: 100%; object-fit: cover; }

.boardInfo { min-width: 0; display: flex; flex-direction: column; gap: 6px; }

.boardCommittee {
  font-weight: 950;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}

.boardNameRow {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}

.boardName {
  font-weight: 950;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.92);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.boardRolePill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(99, 102, 241, 0.22);
  background: rgba(99, 102, 241, 0.08);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 950;
  font-size: 11px;
  flex: 0 0 auto;
}

.boardMetaRow { display: flex; flex-wrap: wrap; gap: 6px; }

.boardChevron {
  opacity: 0.8;
}

.boardPager {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.pagerBtn {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
}
.pagerBtn:hover:not(:disabled) {
  border-color: rgba(56, 189, 248, 0.18);
  transform: translateY(-1px);
}
.pagerBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagerInfo {
  color: rgba(255, 255, 255, 0.68);
  font-weight: 900;
  font-size: 12px;
}

.newsList { display: grid; gap: 10px; }
.newsItem {
  display: grid;
  grid-template-columns: 76px 1fr 18px;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.085);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}
.newsItem:hover {
  transform: translateY(-1px);
  border-color: rgba(56, 189, 248, 0.18);
  background: rgba(255, 255, 255, 0.03);
}

.newsThumb {
  width: 76px;
  height: 52px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  display: grid;
  place-items: center;
}
.newsThumb img { width: 100%; height: 100%; object-fit: cover; }
.newsThumbEmpty { color: rgba(255, 255, 255, 0.7); font-size: 14px; }

.newsInfo { min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.newsTitle {
  font-weight: 950;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.92);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.newsMeta { display: flex; flex-wrap: wrap; gap: 6px; }

.calendarCard {
  grid-column: span 12;
  background: rgba(255, 255, 255, 0.024);
  border-color: rgba(255, 255, 255, 0.09);
}

.calTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.calTitle {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.calBadge {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(99, 102, 241, 0.14));
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
}

.calH { font-weight: 950; letter-spacing: 0.2px; }
.calSub { margin-top: 2px; font-size: 12px; color: rgba(255,255,255,0.6); font-weight: 850; }

.calNav {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.calNavBtn {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  color: rgba(255,255,255,0.85);
  cursor: pointer;
}
.calNavBtn:hover {
  border-color: rgba(56,189,248,0.18);
  transform: translateY(-1px);
}

.calMonth {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  color: rgba(255,255,255,0.85);
  font-weight: 950;
  font-size: 12px;
}
.muted { opacity: 0.7; }

.calGridWrap {
  margin-top: 12px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.015);
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.calWeekHead {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.calWeekCell {
  padding: 10px 8px;
  text-align: center;
  font-weight: 950;
  font-size: 12px;
  color: rgba(255,255,255,0.65);
}

.calGrid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calCell {
  height: 44px;
  border: none;
  outline: none;
  background: transparent;
  border-right: 1px solid rgba(255,255,255,0.06);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: grid;
  place-items: center;
  color: rgba(255,255,255,0.85);
  cursor: pointer;
  position: relative;
}
.calCell:nth-child(7n) { border-right: none; }
.calCell.blank {
  cursor: default;
  opacity: 0.4;
}
.calCell:hover:not(.blank) {
  background: rgba(56,189,248,0.06);
}
.calCell.selected:not(.blank) {
  background: rgba(56,189,248,0.10);
  box-shadow: inset 0 0 0 1px rgba(56,189,248,0.22);
}
.calCell.today:not(.blank) {
  box-shadow: inset 0 0 0 1px rgba(99,102,241,0.24);
}
.calCell.hasEvent:not(.blank) .calNum {
  font-weight: 950;
}
.calNum { font-weight: 850; font-size: 12px; }
.calDot {
  position: absolute;
  bottom: 7px;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: rgba(34,197,94,0.95);
  box-shadow: 0 0 0 5px rgba(34,197,94,0.12);
}

.calBottom {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.calSide, .calForm {
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  padding: 12px;
}

.calSideHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.calSideTitle {
  font-weight: 950;
  color: rgba(255,255,255,0.9);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

.calClearBtn {
  height: 32px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  color: rgba(255,255,255,0.85);
  font-weight: 950;
  font-size: 12px;
  cursor: pointer;
}
.calClearBtn:hover:not(:disabled) {
  border-color: rgba(56,189,248,0.18);
  transform: translateY(-1px);
}
.calClearBtn:disabled { opacity: 0.5; cursor: not-allowed; }

.calEmpty {
  margin-top: 10px;
  padding: 14px;
  border-radius: 14px;
  border: 1px dashed rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.7);
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 10px;
}

.calEvents { margin-top: 10px; display: grid; gap: 10px; }

.calEvent {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
}
.calEventTitle {
  font-weight: 950;
  color: rgba(255,255,255,0.92);
}
.calEventMeta { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 6px; }

.calDelBtn {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  border: 1px solid rgba(239,68,68,0.18);
  background: rgba(239,68,68,0.06);
  color: rgba(255,255,255,0.9);
  cursor: pointer;
}
.calDelBtn:hover {
  border-color: rgba(239,68,68,0.35);
  background: rgba(239,68,68,0.10);
  transform: translateY(-1px);
}

.calFormHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.calFormTitle {
  font-weight: 950;
  color: rgba(255,255,255,0.9);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}
.calTodayBtn {
  height: 32px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(99,102,241,0.22);
  background: rgba(99,102,241,0.08);
  color: rgba(255,255,255,0.9);
  font-weight: 950;
  font-size: 12px;
  cursor: pointer;
}
.calTodayBtn:hover {
  transform: translateY(-1px);
  border-color: rgba(99,102,241,0.3);
}

.calFields { margin-top: 10px; display: grid; gap: 10px; }
.field .label {
  font-weight: 900;
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  margin-bottom: 6px;
}
.input {
  width: 100%;
  height: 40px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  color: rgba(255,255,255,0.92);
  outline: none;
  padding: 0 12px;
  font-weight: 900;
  font-size: 12px;
}
.input:focus {
  border-color: rgba(56,189,248,0.18);
  box-shadow: 0 0 0 6px rgba(56,189,248,0.08);
}
.fieldRow {
  display: grid;
  grid-template-columns: 0.45fr 0.55fr;
  gap: 10px;
}

.btnPrimary {
  height: 40px;
  border-radius: 14px;
  border: 1px solid rgba(56,189,248,0.22);
  background: linear-gradient(90deg, rgba(56,189,248,0.16), rgba(99,102,241,0.10));
  color: rgba(255,255,255,0.95);
  font-weight: 950;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.btnPrimary:disabled { opacity: 0.55; cursor: not-allowed; }
.btnPrimary:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(56,189,248,0.32);
}

.calHint {
  margin-top: 10px;
  color: rgba(255,255,255,0.58);
  font-weight: 850;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(10px);
  display: grid;
  place-items: center;
  padding: 18px;
}
.modal {
  width: min(520px, 92vw);
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(8,14,34,0.92);
  box-shadow: 0 40px 120px rgba(0,0,0,0.65);
  padding: 12px;
}
.modalTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.modalTitle {
  font-weight: 950;
  color: rgba(255,255,255,0.92);
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.xBtn {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  color: rgba(255,255,255,0.85);
  cursor: pointer;
}
.xBtn:hover { transform: translateY(-1px); border-color: rgba(56,189,248,0.18); }

.modalBody {
  padding: 12px 2px;
  color: rgba(255,255,255,0.8);
  font-weight: 850;
}
.modalActions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.btnGhost, .btnDanger {
  height: 38px;
  padding: 0 12px;
  border-radius: 14px;
  font-weight: 950;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  color: rgba(255,255,255,0.9);
}
.btnGhost:hover { transform: translateY(-1px); border-color: rgba(56,189,248,0.18); }

.btnDanger {
  border-color: rgba(239,68,68,0.22);
  background: rgba(239,68,68,0.08);
}
.btnDanger:hover { transform: translateY(-1px); border-color: rgba(239,68,68,0.35); }

.toastWrap {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 100001;
  display: grid;
  gap: 10px;
}
.toast {
  width: min(360px, 92vw);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(8,14,34,0.92);
  box-shadow: 0 24px 70px rgba(0,0,0,0.55);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255,255,255,0.9);
  font-weight: 900;
}
.toast i { opacity: 0.95; }
.toast.ok { border-color: rgba(34,197,94,0.25); }
.toast.danger { border-color: rgba(239,68,68,0.25); }
.toastMsg { min-width: 0; }

@media (max-width: 1100px) {
  .statCard { grid-column: span 6; }
  .statCard.wide { grid-column: span 6; }
  .leftCol { grid-column: span 12; }
  .sideCol { grid-column: span 12; }
  .dashTop { flex-direction: column; align-items: stretch; }
  .topActions { justify-content: flex-end; }
  .menuPanel { right: 0; left: auto; }
  .calBottom { grid-template-columns: 1fr; }
}
@media (max-width: 920px) {
  .statCard { grid-column: span 12; }
  .statCard.wide { grid-column: span 12; }
  .chartActions { width: 100%; justify-content: space-between; }
  .fieldRow { grid-template-columns: 1fr; }
}
</style>