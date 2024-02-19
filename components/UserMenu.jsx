import React, {useState, useRef, useCallback, useEffect} from 'react';

const UserMenu = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = useCallback(() => {
        setIsMenuOpen(!isMenuOpen);
    }, [isMenuOpen]);

    const menuRef = useRef(null);

    // 点击外部关闭菜单的函数
    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setIsMenuOpen(false);
        }
    };

    useEffect(() => {
        // 添加全局点击事件监听器
        window.addEventListener('mousedown', handleClickOutside);

        // 组件卸载时移除事件监听器
        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    return (
        <div ref={menuRef} className="relative ml-2 sm:ml-16">
            <button onClick={toggleMenu} className="flex items-center justify-center p-2 -m-2 text-xl rounded-full focus:outline-none focus:ring">
                <img
                    src="https://imagedelivery.net/MPdwyYSWT8IY7lxgN3x3Uw/a9572d6d-2c7f-408b-2f17-65d1e09d9500/thumbnail" // 替换成您的账号头像路径
                    alt="Your Avatar"
                    className="w-8 h-8 rounded-full sm:w-10 sm:h-10"
                />
            </button>
            {isMenuOpen && (
                <div className="absolute right-0 mt-2 py-2 w-48 bg-white shadow-lg rounded-lg">
                    <a href="#" className="block px-4 py-2 text-customBlackText hover:bg-customWhite">注销</a>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
