import type { BookmarkNode } from './model'

const minute = 60_000
const now = Date.now()

export const demoBookmarkTree: Array<BookmarkNode> = [
  {
    id: 'root',
    title: '',
    children: [
      {
        id: '1',
        title: '书签栏',
        folderType: 'bookmarks-bar',
        syncing: true,
        children: [
          {
            id: 'work',
            title: '工作',
            children: [
              {
                id: 'linear',
                title: 'Linear',
                url: 'https://linear.app',
                dateAdded: now - minute * 8,
              },
              {
                id: 'figma',
                title: 'Figma',
                url: 'https://figma.com',
                dateAdded: now - minute * 28,
              },
              {
                id: 'notion',
                title: 'Notion',
                url: 'https://notion.so',
                dateAdded: now - minute * 48,
              },
              {
                id: 'github',
                title: 'GitHub',
                url: 'https://github.com',
                dateAdded: now - minute * 86,
              },
              {
                id: 'vercel',
                title: 'Vercel',
                url: 'https://vercel.com',
                dateAdded: now - minute * 140,
              },
              {
                id: 'work-projects',
                title: '项目管理',
                children: [
                  {
                    id: 'height',
                    title: 'Height',
                    url: 'https://height.app',
                    dateAdded: now - minute * 520,
                  },
                ],
              },
            ],
          },
          {
            id: 'design',
            title: '设计',
            children: [
              {
                id: 'mobbin',
                title: 'Mobbin — UI & UX reference library',
                url: 'https://mobbin.com',
                dateAdded: now - minute * 180,
              },
              {
                id: 'are-na',
                title: 'Are.na',
                url: 'https://www.are.na',
                dateAdded: now - minute * 240,
              },
            ],
          },
          {
            id: 'development',
            title: '开发',
            children: [
              {
                id: 'mdn',
                title: 'MDN Web Docs',
                url: 'https://developer.mozilla.org',
                dateAdded: now - minute * 320,
              },
              {
                id: 'react',
                title: 'React',
                url: 'https://react.dev',
                dateAdded: now - minute * 410,
              },
            ],
          },
        ],
      },
      {
        id: '2',
        title: '其他书签',
        folderType: 'other',
        syncing: false,
        children: [
          {
            id: 'reading',
            title: '阅读清单',
            children: [
              {
                id: 'sspai',
                title: '少数派 — 高效工作，品质生活',
                url: 'https://sspai.com',
                dateAdded: now - minute * 16,
              },
              {
                id: 'zhihu',
                title: '知乎 — 有问题，就会有答案',
                url: 'https://zhihu.com',
                dateAdded: now - minute * 72,
              },
            ],
          },
        ],
      },
    ],
  },
]
