import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './api/v1/models/users.model';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/DevHub';

async function makeAdmin() {
    const emailToUpgrade = 'phu0348880746@gmail.com';
    console.log(`🔑 ĐANG NÂNG CẤP TÀI KHOẢN ${emailToUpgrade} LÊN ADMIN...`);

    try {
        await mongoose.connect(MONGO_URL);
        console.log('🔌 Kết nối cơ sở dữ liệu thành công!');

        const user = await User.findOne({ email: emailToUpgrade });
        if (!user) {
            console.log(`❌ Không tìm thấy tài khoản với email: ${emailToUpgrade}`);
            return;
        }

        user.role = 'admin';
        await user.save();

        console.log(`\n🎉 THÀNH CÔNG! Tài khoản ${emailToUpgrade} hiện đã được cấp quyền ADMIN.`);
        console.log(`Vai trò hiện tại: ${user.role}`);
        
    } catch (error) {
        console.error('❌ Lỗi khi nâng cấp tài khoản:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối cơ sở dữ liệu.');
    }
}

makeAdmin();
