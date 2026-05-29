import mongoose from 'mongoose';
import dotenv from 'dotenv';
import slugify from 'slugify';
import Badge from './api/v1/models/badges.model';
import Product from './api/v1/models/products.model';
import Resource from './api/v1/models/resources.model';
import User from './api/v1/models/users.model';

dotenv.config();

const MONGODB_URL = process.env.MONGO_URL || process.env.MONGODB_URL || 'mongodb://localhost:27017/DevHub';

async function runSeed() {
    console.log('🌱 BẮT ĐẦU CHÈN DỮ LIỆU MẪU (SEEDING) VÀO DATABASE DEVHUB...');
    
    try {
        await mongoose.connect(MONGODB_URL);
        console.log('🔌 Kết nối cơ sở dữ liệu thành công!');

        // 1. Tạo hoặc lấy tài khoản Admin để làm tác giả cho các sản phẩm/tài liệu mẫu
        let adminUser = await User.findOne({ email: 'admin@devhub.com' });
        if (!adminUser) {
            console.log('👤 Không tìm thấy tài khoản admin mẫu, đang tạo tài khoản Admin...');
            adminUser = new User({
                username: 'devhub_admin',
                email: 'admin@devhub.com',
                password: '$2a$10$xyzFakeHashPasswordForSeed123456789', // Hashed mock password
                displayName: 'DevHub Admin',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                role: 'admin',
                reputation: 999
            });
            await adminUser.save();
            console.log('   ✅ Đã tạo tài khoản DevHub Admin thành công!');
        } else {
            console.log('   ✅ Đã lấy được tài khoản Admin sẵn có.');
        }

        const authorId = adminUser._id;

        // -------------------------------------------------------------
        // 2. SEED HUY HIỆU (BADGES)
        // -------------------------------------------------------------
        console.log('\n🏅 2. Đang cập nhật danh sách Huy hiệu (Badges)...');
        await Badge.deleteMany({}); // Reset lại danh mục huy hiệu
        
        const seedBadges = [
            {
                name: 'Thành viên mới (Newbie)',
                icon: 'https://cdn-icons-png.flaticon.com/512/10473/10473523.png',
                description: 'Dành cho lập trình viên mới gia nhập cộng đồng DevHub.'
            },
            {
                name: 'Cây viết tích cực (Active Poster)',
                icon: 'https://cdn-icons-png.flaticon.com/512/10043/10043585.png',
                description: 'Đã đóng góp trên 5 bài viết chia sẻ kiến thức mạng xã hội.'
            },
            {
                name: 'Siêu Tác Giả (Super Author)',
                icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135295.png',
                description: 'Có chuỗi bài viết kỹ thuật (Series) học tập xuất sắc được phê duyệt bởi Admin.'
            },
            {
                name: 'Kỹ sư công nghệ (Market Maker)',
                icon: 'https://cdn-icons-png.flaticon.com/512/6840/6840478.png',
                description: 'Đăng tải sản phẩm lập trình chất lượng đầu tiên lên Marketplace.'
            },
            {
                name: 'Đại sứ tri thức (VIP Contributor)',
                icon: 'https://cdn-icons-png.flaticon.com/512/2168/2168563.png',
                description: 'Đóng góp nhiều tài nguyên, mã nguồn mở hữu ích cho cộng đồng học tập.'
            }
        ];

        await Badge.insertMany(seedBadges);
        console.log(`   ✅ Đã chèn thành công ${seedBadges.length} Huy hiệu!`);

        // -------------------------------------------------------------
        // 3. SEED SẢN PHẨM (PRODUCTS ON MARKETPLACE)
        // -------------------------------------------------------------
        console.log('\n🛍️ 3. Đang cập nhật danh sách sản phẩm Marketplace...');
        await Product.deleteMany({}); // Clear cũ
        
        const seedProducts = [
            {
                title: 'Landing Page LandingHub React + Tailwind',
                slug: 'landing-page-landinghub-react-tailwind-' + Math.floor(Math.random() * 10000),
                description: 'Mẫu giao diện Landing Page chuyên nghiệp cực đẹp cho Startup, được xây dựng trên React JS, Tailwind CSS, tối ưu hóa SEO và Responsive 100%. Tốc độ tải trang siêu nhanh.',
                image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600',
                price: 150000,
                currency: 'VND',
                category: 'templates',
                tags: ['React', 'Tailwind', 'Landing Page', 'SEO'],
                author: authorId,
                downloadUrl: 'https://github.com/mock-repo/landinghub-react-tailwind',
                preview: 'https://landinghub-demo.vercel.app',
                status: 'approved',
                sales: 12,
                rating: 4.8
            },
            {
                title: 'Full Stack E-Commerce Starter Kit',
                slug: 'full-stack-e-commerce-starter-kit-' + Math.floor(Math.random() * 10000),
                description: 'Bộ khung hoàn chỉnh để phát triển website bán hàng cao cấp bao gồm Next.js, Express, MongoDB. Đã tích hợp sẵn xác thực JWT, giỏ hàng, trang quản trị Admin và cổng thanh toán Stripe giả lập.',
                image: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=600',
                price: 450000,
                currency: 'VND',
                category: 'code',
                tags: ['Next.js', 'Express', 'MongoDB', 'Stripe'],
                author: authorId,
                downloadUrl: 'https://github.com/mock-repo/ecommerce-starter-kit',
                preview: 'https://next-ecommerce-demo.vercel.app',
                status: 'approved',
                sales: 24,
                rating: 5.0
            },
            {
                title: 'Developer Portfolio Minimalist Template',
                slug: 'developer-portfolio-minimalist-template-' + Math.floor(Math.random() * 10000),
                description: 'Mẫu thiết kế portfolio cá nhân phong cách tối giản tuyệt đẹp dành cho các nhà phát triển phần mềm giới thiệu dự án, kinh nghiệm và kỹ năng. Hỗ trợ hiển thị tối ưu trên thiết bị di động.',
                image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600',
                price: 99000,
                currency: 'VND',
                category: 'templates',
                tags: ['HTML', 'CSS', 'Portfolio', 'Minimalist'],
                author: authorId,
                downloadUrl: 'https://github.com/mock-repo/dev-portfolio-minimalist',
                preview: 'https://dev-portfolio-demo.vercel.app',
                status: 'approved',
                sales: 45,
                rating: 4.5
            }
        ];

        await Product.insertMany(seedProducts);
        console.log(`   ✅ Đã chèn thành công ${seedProducts.length} Sản phẩm mẫu lên Marketplace!`);

        // -------------------------------------------------------------
        // 4. SEED TÀI NGUYÊN HỌC TẬP (LEARNING RESOURCES)
        // -------------------------------------------------------------
        console.log('\n📚 4. Đang cập nhật danh sách Tài nguyên học tập...');
        await Resource.deleteMany({}); // Clear cũ
        
        const seedResources = [
            {
                title: 'React Hooks Complete Guide & Best Practices',
                slug: 'react-hooks-complete-guide-best-practices-' + Math.floor(Math.random() * 10000),
                description: 'Cẩm nang hướng dẫn chuyên sâu về toàn bộ các Hooks trong React từ cơ bản đến nâng cao bao gồm useState, useEffect, useMemo, useCallback, custom hooks. Hướng dẫn tránh lỗi re-render và tối ưu hiệu năng.',
                type: 'pdf',
                fileUrl: 'https://pdf-server.devhub.com/resources/react-hooks-guide.pdf',
                isPremium: false,
                author: authorId,
                downloads: 128,
                rating: 4.9
            },
            {
                title: 'TypeScript Masterclass Source Code & Exercises',
                slug: 'typescript-masterclass-source-code-exercises-' + Math.floor(Math.random() * 10000),
                description: 'Bộ sưu tập đầy đủ mã nguồn, bài tập thực hành kèm đáp án giải thích chi tiết giúp lập trình viên nhanh chóng làm chủ ngôn ngữ TypeScript, Generics, Decorators, Utility Types trong dự án thực tế.',
                type: 'code',
                fileUrl: 'https://github.com/mock-repo/typescript-masterclass-source',
                isPremium: true,
                author: authorId,
                downloads: 64,
                rating: 5.0
            },
            {
                title: 'RESTful API Design Standards & Best Practices',
                slug: 'restful-api-design-standards-best-practices-' + Math.floor(Math.random() * 10000),
                description: 'Bộ tài liệu video chuẩn hóa cấu trúc thư mục, quy tắc thiết kế URI, định dạng JSON phản hồi, xác thực JWT, cơ chế nén phản hồi và bảo mật cơ bản cho REST API Express.js.',
                type: 'video',
                fileUrl: 'https://video-server.devhub.com/resources/restful-api-standards.mp4',
                isPremium: true,
                author: authorId,
                downloads: 42,
                rating: 4.7
            }
        ];

        await Resource.insertMany(seedResources);
        console.log(`   ✅ Đã chèn thành công ${seedResources.length} Tài nguyên học tập mẫu!`);

        console.log('\n🎉🎉🎉 SEED DỮ LIỆU MẪU THÀNH CÔNG 100%! 🎉🎉🎉');
        console.log('MongoDB Atlas của bạn hiện đã có đầy đủ danh mục Huy hiệu, Sản phẩm Chợ và Tài nguyên học tập.');
        
    } catch (error) {
        console.error('\n❌ SEED DỮ LIỆU THẤT BẠI:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối cơ sở dữ liệu.');
    }
}

runSeed();
