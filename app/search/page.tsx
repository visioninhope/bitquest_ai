'use client';

import {useState, useEffect} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSearch} from "@fortawesome/free-solid-svg-icons";
import Markdown from "@/lib/mark-down";
import ReferenceCard from "@/components/ReferenceCard";
import DerivedQuestionCard from "@/components/DerivedQuestionCard";
import {useSearchParams, useRouter} from 'next/navigation';
import {GoogleCustomSearchResponse} from "@/pages/api/types";

export default function Page() {
    /*const [count, setCount] = useState({content: 'Answer 1', count: 1});*/
    const [data, setData] = useState('');
    const [query, setQuery] = useState<GoogleCustomSearchResponse>({
        items: [],
        queries: {
            request: [],
            nextPage: [],
        },
    });
    const searchParams = useSearchParams();

    let done = false;

    const searchResults = [
        {
            title: '杭州有什么好吃的，详细罗列。',
            content: '杭州有什么好吃的，详细罗列。',
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

    useEffect(() => {
        if (query.items?.length === 0) {
            return;
        }
        fetchAndSummarizeData(query);
    }, [query]);

    useEffect(() => {
        const query = searchParams?.get('q');

        if (query && !done) {
            done = true;
            fetch('/api/googleSearch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({query}),
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
            {/*左侧边栏*/}
            <div className="bg-customGray flex h-screen w-72 flex-col">
                {/*顶部区域：Logo和搜索按钮*/}
                <div className="border-customWhite flex h-20 items-center justify-between border-b">
                    {/*Logo*/}
                    <img className="ml-4 h-8" src="http://localhost:3000/logo-final.svg" alt="Logo"/>
                    {/*搜索按钮*/}
                    <button className="mr-4 p-2 text-xl">
                        <FontAwesomeIcon icon={faSearch}
                                         className="text-customWhite hover:text-customOrange transition duration-150 ease-in-out"/>
                    </button>
                </div>

                {/*历史搜索结果容器*/}
                <div className="flex-1 overflow-y-auto">
                    {/*历史搜索结果*/}
                    <div className="p-4">
                        <h2 className="text-customWhite mb-4 text-xl font-semibold">历史搜索</h2>
                        <ul className="space-y-2">
                            <li><a href="#" className="block rounded p-2 text-customWhite">搜索结果
                                #1</a></li>
                            <li><a href="#" className="block rounded p-2 text-customWhite">搜索结果
                                #2</a></li>
                            <li><a href="#" className="block rounded p-2 text-customWhite">搜索结果
                                #3</a></li>
                            {/*更多历史搜索结果*/}
                        </ul>
                    </div>
                </div>

                {/*账号信息*/}
                <div className="p-4 border-t border-customGray">
                    <div className="mb-4 flex items-center">
                        <img className="mr-3 h-10 w-10 rounded-full"
                             src="https://imagedelivery.net/MPdwyYSWT8IY7lxgN3x3Uw/a9572d6d-2c7f-408b-2f17-65d1e09d9500/thumbnail"
                             alt="用户头像"/>
                        <div>
                            <div className="font-semibold text-customWhite">Lison Allen</div>
                            <a href="#" className="text-sm text-customOrange">设置</a>
                        </div>
                    </div>
                </div>
            </div>

            {/*主内容区*/}
            <div className="flex-1 p-4">
                <div className="overflow-hidden rounded bg-white shadow">
                    <div className="p-4 sm:p-6">
                        <h1 className="mb-4 text-xl font-semibold text-gray-800">搜索结果</h1>
                        <div className="border-t border-gray-200">
                            {/* 迭代搜索结果 */}
                            {searchResults.map((result, index) => (
                                <div key={index} className="border-b border-gray-200 px-4 py-5 sm:px-6">
                                    <h2 className="text-lg font-medium text-gray-800">{result.title}</h2>

                                    <div className="flex overflow-x-auto p-2 space-x-4">
                                        {referenceData?.map((data, index) => (
                                            <ReferenceCard key={index} data={data}/>
                                        ))}
                                    </div>

                                    {/* Markdown 渲染 */}
                                    <div className="prose mt-2 max-w-none">
                                        <Markdown content={data}/>
                                    </div>

                                    <div className="flex flex-wrap justify-around">
                                        {derivedQuestions.map(question => (
                                            <DerivedQuestionCard key={question.id} question={question}/>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* 底部链接或信息 */}
                        <div className="mt-4 px-4 py-4 sm:px-6">
                            <p className="text-xs text-gray-500">其他信息或链接。</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}