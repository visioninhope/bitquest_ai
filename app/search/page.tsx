'use client';

import React, {useState, useEffect, useCallback, useRef} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSearch, faClipboardQuestion} from "@fortawesome/free-solid-svg-icons";
import Markdown from "@/lib/mark-down";
import ReferenceCard from "@/components/ReferenceCard";
import DerivedQuestionCard from "@/components/DerivedQuestionCard";
import {useSearchParams, useRouter} from 'next/navigation';
import {GoogleCustomSearchResponse} from "@/pages/api/types";

export default function Page() {
    const [data, setData] = useState('');
    const [query, setQuery] = useState<GoogleCustomSearchResponse>({
        items: [],
        queries: {
            request: [],
            nextPage: [],
        },
    });
    const searchParams = useSearchParams();
    const [searchTerms, setSearchTerms] = useState('');
    const router = useRouter();

    let done = false;

    const searchResults = [
        {
            title: '',
            content: '',
        }, {
            title: '',
            content: '',
        }];

    const referenceData = query.items;

    const derivedQuestions = [
        {
            id: 1,
            text: "衍生问题 1",
            moreInfoLink: "#link1"
        },
        {
            id: 2,
            text: "衍生问题 2",
            moreInfoLink: "#link2"
        },
        {
            id: 3,
            text: "衍生问题 3",
            moreInfoLink: "#link3"
        }
    ];

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = useCallback(() => {
        setIsMenuOpen(!isMenuOpen);
    }, [isMenuOpen]);

    const menuRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭菜单的函数
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false);
        }
    };

    // 创建一个 ref 来引用输入框
    const searchInputRef = useRef<HTMLInputElement>(null);

    // 键盘事件处理函数
    const handleGlobalKeyDown = (event: KeyboardEvent) => {

        // 检查是否按下了 'K' 键，同时按下了 'Meta' 键（Mac）或 'Control' 键（Windows/Linux）
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
            event.preventDefault(); // 阻止默认行为
            searchInputRef.current?.focus(); // 聚焦到输入框
        }
    };

    useEffect(() => {
        // 添加事件监听器
        window.addEventListener('keydown', handleGlobalKeyDown);
        // 添加全局点击事件监听器
        window.addEventListener('mousedown', handleClickOutside);

        // 组件卸载时移除事件监听器
        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown);
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    const fetchAndSummarizeData = (googleSearchRes: GoogleCustomSearchResponse) => {
        const eventSource = new EventSource(`/api/update?prompt=` + encodeURIComponent(`合并以下多个搜索结果，结合你的知识，生成用户想要的答案，并在回复中标注各条搜索结果的引用部分。

${googleSearchRes.items?.map((result, index) => `搜索结果${index + 1}： ${result.snippet}`).join('\n')}
    
结合上述搜索结果和你的知识，请提供关于 ${googleSearchRes.queries?.request[0].searchTerms} 的综合性中文答案，并在回复中明确标注引用的部分。
`));

        eventSource.onmessage = (event) => {
            // 将完整的字符串拆分为单独的 JSON 对象，并处理每一个
            const jsonObjects = event.data.split('data: ').slice(0);
            let partString = '';
            jsonObjects.forEach((jsonStr: string) => {
                if (jsonStr.trim() !== '[DONE]') {
                    const jsonData = JSON.parse(jsonStr);
                    // 处理每一个 JSON 对象
                    if (jsonData.generated_text !== null && jsonData.generated_text !== '') {
                        setData(jsonData.generated_text);
                        return;
                    }
                    console.log(jsonData.choices[0]?.text);
                    partString += jsonData.choices[0]?.text.toString();
                } else {
                    eventSource.close();
                }
            });
        };

        eventSource.onerror = (error) => {
            console.error('EventSource failed:', error);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    };

    const handleSearch = () => {
        // 更新 URL，这里将触发 useSearchParams 的变化
        router.push(`/search?q=${encodeURIComponent(searchTerms)}`);
    };

    // 更新状态变量以匹配输入框的内容
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerms(event.target.value);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        // 检查是否同时按下了 'Enter' 键和 'Meta' 键（Mac 的 Command 键）或 'Control' 键（Windows/Linux）
        if (event.key === 'Enter') {
            handleSearch(); // 调用搜索处理函数
        }
    };


    useEffect(() => {
        if (query.items?.length === 0) {
            return;
        }
        fetchAndSummarizeData(query);
    }, [query]);

    useEffect(() => {
        const keywords = searchParams?.get('q');
        setSearchTerms(keywords ? keywords : '');

        if (keywords && !done) {
            done = true;
            fetch('/api/googleSearch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({keywords}),
            })
                .then((response) => response.json())
                .then((data) => {
                    setQuery(data);
                    done = false;
                });
        }
    }, [searchParams]);

    return (
        <div className="flex min-h-screen">
            {/*顶部菜单栏*/}
            <div className="fixed left-1/2 transform -translate-x-1/2 p-4 w-full z-50">
                <div className="bg-customBlack rounded-lg p-4 w-full flex items-center justify-between shadow">
                    {/* 左侧 Logo */}
                    <div className="text-customWhite2 text-2xl font-semibold mr-16">
                        Coogle.AI
                    </div>

                    {/* 中间搜索框 */}
                    <div className="flex-1 mx-4 flex items-center relative w-3/4">
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="搜索..."
                            className="bg-gray-700 text-white border border-gray-600 rounded-full py-2 pl-4 pr-10 w-full"
                            value={searchTerms}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="mr-2 text-sm text-gray-400">⌘ + K</span>
                            <button className="p-2 text-xl" onClick={handleSearch}>
                                <FontAwesomeIcon icon={faSearch}
                                                 className="text-customWhite2 hover:text-customOrange transition duration-150 ease-in-out"/>
                            </button>
                        </div>
                    </div>

                    {/* 右侧账号头像和下拉菜单 */}
                    <div className="relative ml-16" ref={menuRef}>
                        <button
                            className="text-white relative z-10 flex items-center"
                            onClick={toggleMenu}
                        >
                            <img
                                src="https://imagedelivery.net/MPdwyYSWT8IY7lxgN3x3Uw/a9572d6d-2c7f-408b-2f17-65d1e09d9500/thumbnail" // 替换成您的账号头像路径
                                alt="Your Avatar"
                                className="w-8 h-8 rounded-full"
                            />
                        </button>

                        {/* 下拉菜单 */}
                        {isMenuOpen && (
                            <div
                                className="absolute right-0 mt-2 py-2 w-36 bg-customWhite2 border border-gray-300 shadow-lg rounded-lg">
                                <a
                                    href="#"
                                    className="block px-4 py-2 text-customBlackText hover:bg-customWhite"
                                >
                                    注销
                                </a>
                                {/* 添加更多菜单项 */}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/*主内容区*/}
            <div className="flex-1 p-4 pt-24 bg-customWhite2 text-customBlackText">
                {/* 迭代搜索结果 */}
                {searchResults.map((result, index) => (
                    <div key={index}
                         className="px-8 py-5 sm:px-6 overflow-hidden rounded bg-customWhite shadow mt-4">
                        <h2 className="text-lg font-medium text-gray-800 mb-4"><FontAwesomeIcon className="text-customOrange mr-2" icon={faClipboardQuestion} /> {query.queries?.request[0]?.searchTerms}</h2>

                        {/* Markdown 渲染 */}
                        <div className="prose mt-2 max-w-none pb-4 border-dashed border-b border-customGray">
                            <Markdown content={data}/>
                        </div>

                        <div className="flex flex-wrap overflow-x-auto pt-2 pb-2">
                            {referenceData?.map((data, index) => (
                                <ReferenceCard key={index} data={data}/>
                            ))}
                        </div>

                        <div className="flex flex-wrap justify-around">
                            {derivedQuestions.map(question => (
                                <DerivedQuestionCard key={question.id} question={question}/>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}