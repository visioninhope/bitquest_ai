// pages/api/stream.js
import axios from 'axios';

export default async function handler(req, res) {
    // 配置 OpenAI 请求
    const togetherAIRequest = axios.create({
        baseURL: 'https://api.together.xyz',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.API_BEARER_TOKEN}`
        },
        responseType: 'stream' // 重要：设置响应类型为流
    });

    try {
        // 向 TogetherAI 发送请求
        const response = await togetherAIRequest.post('/inference', {
            // TogetherAI API 请求体
            model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
            prompt: "{}<human>: " + req.query.prompt + "\n response limit in 500 token \n<expert>:",
            max_tokens: 512,
            stop: '[/INST],</s>',
            temperature: 0.7,
            top_p: 0.7,
            top_k: 50,
            repetition_penalty: 1,
            stream: true,
        });

        // 设置头部以启用流式传输
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });

        let buffer = '';
        let lastFlushTime = Date.now();
        const flushInterval = 1000; // 设置为 1000 毫秒（1秒）

        // 监听流上的 'data' 事件
        response.data.on('data', (chunk) => {
            const chunkAsString = chunk.toString('utf-8');
            console.log('Received chunk: ', chunkAsString);

            /*// 将数据添加到缓冲区
            buffer += chunkAsString;

            // 检查是否应该将缓冲区数据发送给客户端
            if (Date.now() - lastFlushTime > flushInterval) {
                console.log('Buffer: ', buffer);
                res.write(buffer);
                console.log('Sent chunk: ', buffer);
                buffer = ''; // 清空缓冲区
                lastFlushTime = Date.now();
            }*/

            // 也可以将数据块直接传输给客户端
            res.write(chunkAsString);
            res.flush;
        });

        // 当流结束时，结束响应
        response.data.on('end', () => {
            /*if (buffer.length > 0) {
                res.write(buffer);
            }*/
            /*buffer = 'Hello World';
            const interval = setInterval(() => {
                if (buffer.length > 0) {
                    console.log('buffer', buffer);
                    res.write(buffer);
                    res.flush;
                }
            }, 1000); // 每1000毫秒（1秒）更新一次*/

            // return () => clearInterval(interval);
            console.log('Stream ended');
            res.end();
        });

        // 将 TogetherAI 响应的数据流直接传输给客户端
        // response.data.pipe(res);
    } catch (error) {
        console.error('Error communicating with TogetherAI:', error);
        res.status(500).send('Internal Server Error');
    }
}
