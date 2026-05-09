import slugify from 'slugify';

export const createSlug = (title: string): string => {
    return `${slugify(title, {
        replacement: '-',  // Ký tự thay thế khoảng trắng (mặc định là '-')
        remove: undefined, // Bỏ qua các ký tự đặc biệt (nếu muốn giữ lại ký tự nào thì điền vào đây)
        lower: true,       // Ép tất cả về chữ thường (HỌC -> hoc)
        strict: true,      // Cắt bỏ hoàn toàn các ký tự đặc biệt như @, #, !, ?,...
        locale: 'vi',      // QUAN TRỌNG NHẤT: Bật chế độ tiếng Việt để xóa dấu (á, à, ả -> a)
        trim: true         // Xóa khoảng trắng bị thừa ở đầu và cuối chuỗi
    })}-${Math.random().toString(36).substring(2, 7)}`;
};