// Everyday hero names, skills and tooltips (skill-info.ts DISGUISE_INFO builds the English from combat.ts DZ; the numbers here
// must match it: tests/everyday-disguises.test.ts compares them).
export const EVERYDAY_DISGUISES_VI: Record<string, string> = {
  'Sporty swimmer': 'Vận động viên bơi lội',
  'K-pop singer': 'Ca sĩ K-pop',
  'Yoga teacher': 'Giáo viên yoga',
  'Kindhearted nurse': 'Y tá tận tâm',
  'Splash wave': 'Sóng tung tóe',
  'Torpedo dash': 'Lao như ngư lôi',
  'Whirlpool': 'Xoáy nước',
  'Mic drop': 'Thả mic',
  'Light-stick beam': 'Tia gậy cổ vũ',
  'Encore': 'Encore!',
  'Spotlight finale': 'Màn kết ánh đèn',
  'Tree pose': 'Tư thế cái cây',
  'Sun salutation': 'Chào mặt trời',
  'Calm breath': 'Hơi thở an yên',
  'Lotus bloom': 'Sen nở',
  'First aid': 'Sơ cứu',
  'Bandage wrap': 'Quấn băng',
  'Vitamin toss': 'Ném vitamin',
  'Ambulance rush': 'Xe cứu thương lao tới',
  'Splash a wave through a 120° cone 7 m ahead: ×1.4 damage, enemies washed back and slowed 3 s.':
    'Hất một con sóng qua hình nón 120° dài 7 m phía trước: ×1.4 sát thương, kẻ địch bị cuốn lùi và chậm lại 3 giây.',
  'Blow a bubble shield: no damage for 4 s and 15% health back.':
    'Thổi khiên bong bóng: không nhận sát thương trong 4 giây và hồi 15% máu.',
  'Dive 9.1 m forward like a torpedo, untouchable, ×1.6 damage to every enemy on the way.':
    'Lao 9.1 m về phía trước như ngư lôi, không thể bị chạm, ×1.6 sát thương lên mọi kẻ địch trên đường.',
  'Open a whirlpool on the nearest enemy within 12 m for 3 s: enemies within 9 m are pulled in and slowed, and those in its 3.5 m eye take ×0.5 damage every 0.5 s.':
    'Mở xoáy nước trên kẻ địch gần nhất trong 12 m trong 3 giây: kẻ địch trong 9 m bị hút vào và chậm lại, ai ở tâm xoáy 3.5 m chịu ×0.5 sát thương mỗi 0.5 giây.',
  'Drop the mic: a shockwave 6.5 m around you, ×2.4 damage, enemies pushed back and stunned 1.2 s.':
    'Thả mic: sóng chấn động 6.5 m quanh bạn, ×2.4 sát thương, kẻ địch bị đẩy lùi và choáng 1.2 giây.',
  'Shine the light stick in a 12 m beam: ×3.2 damage to every enemy in the line, dazzled for 1.5 s.':
    'Chiếu gậy cổ vũ thành tia dài 12 m: ×3.2 sát thương lên mọi kẻ địch trên đường thẳng, bị lóa mắt 1.5 giây.',
  'Encore! 25% health back, you move 60% faster for 6 s, and your pets attack 50% faster for 6 s.':
    'Encore! Hồi 25% máu, bạn chạy nhanh hơn 60% trong 6 giây và thú cưng tấn công nhanh hơn 50% trong 6 giây.',
  'Stage lights fall on the nearest enemy within 12 m: 4 confetti beats of ×1.3 damage within 5.5 m, then the finale: ×5 damage and a 1.8 s stun.':
    'Đèn sân khấu rọi xuống kẻ địch gần nhất trong 12 m: 4 nhịp pháo giấy ×1.3 sát thương trong 5.5 m, rồi màn kết: ×5 sát thương và choáng 1.8 giây.',
  'Hold the tree pose for 6 s: +80 defence, and 8% health back at once.':
    'Giữ tư thế cái cây trong 6 giây: +80 phòng thủ và hồi ngay 8% máu.',
  'A sun salutation: 3% health back every 0.5 s for 6 s (36% in all).':
    'Chào mặt trời: hồi 3% máu mỗi 0.5 giây trong 6 giây (tổng 36%).',
  'Breathe out a calm wind through a 91° cone 8 m ahead: ×1 damage, enemies blown far back and slowed 3 s.':
    'Thở ra làn gió an yên qua hình nón 91° dài 8 m phía trước: ×1 sát thương, kẻ địch bị thổi bay xa và chậm lại 3 giây.',
  'A lotus blooms 6 m around you: enemies inside are rooted 2.5 s, then for 5 s its petals slow them and deal ×0.1 damage every 0.5 s.':
    'Hoa sen nở 6 m quanh bạn: kẻ địch bên trong bị giữ chân 2.5 giây, rồi trong 5 giây cánh sen làm chậm và gây ×0.1 sát thương mỗi 0.5 giây.',
  'First aid: 45% health back at once and no damage for 1 s.':
    'Sơ cứu: hồi ngay 45% máu và không nhận sát thương trong 1 giây.',
  'Wrap the nearest enemy within 10 m and up to 2 more within 5.5 m of it in bandages: ×1.2 damage and held for 3 s.':
    'Quấn băng kẻ địch gần nhất trong 10 m và tối đa 2 kẻ khác trong 5.5 m quanh nó: ×1.2 sát thương và bị giữ 3 giây.',
  'Toss a vitamin at the nearest enemy within 11 m: it bounces to 4 enemies in all (each the nearest within 5 m), ×2 damage each, and every hit heals you 4.5%.':
    'Ném vitamin vào kẻ địch gần nhất trong 11 m: viên thuốc nảy qua tổng cộng 4 kẻ địch (mỗi lần tới kẻ gần nhất trong 5 m), ×2 sát thương mỗi kẻ, và mỗi lần trúng hồi cho bạn 4.5% máu.',
  'Ambulance rush: drive 8.4 m forward with the siren on, untouchable, ×1.6 damage to every enemy on the way, knocking them 6 m aside; then move 20% faster for 2 s.':
    'Xe cứu thương lao tới: bật còi lao 8.4 m về phía trước, không thể bị chạm, ×1.6 sát thương lên mọi kẻ địch trên đường và hất chúng sang bên 6 m; sau đó chạy nhanh hơn 20% trong 2 giây.',
  'A splash wave, a bubble shield, a torpedo dash and a whirlpool. +6 attack · +8 defense · +40 health · +8% speed. Swimming and oxygen bonuses still come from flippers.': 'Sóng tung tóe, khiên bong bóng, lao như ngư lôi và xoáy nước. +6 tấn công · +8 phòng thủ · +40 máu · +8% tốc độ. Lợi ích khi bơi và dùng oxy vẫn đến từ chân vịt.',
  'A mic drop, a light-stick beam, an encore and the spotlight finale. +10 attack · +6% critical chance · +5% speed.': 'Thả mic, tia gậy cổ vũ, encore và màn kết ánh đèn. +10 tấn công · +6% cơ hội chí mạng · +5% tốc độ.',
  'The tree pose, a sun salutation, a calm breath and a lotus bloom. +12 defense · +60 health · +2 regeneration.': 'Tư thế cái cây, chào mặt trời, hơi thở an yên và sen nở. +12 phòng thủ · +60 máu · +2 hồi phục.',
  'First aid, a bandage wrap, a bouncing vitamin and the ambulance rush. +8 defense · +80 health · +3 regeneration. Healing restores your health, not other explorers.': 'Sơ cứu, quấn băng, vitamin nảy và xe cứu thương lao tới. +8 phòng thủ · +80 máu · +3 hồi phục. Chỉ hồi máu cho bạn, không hồi cho người chơi khác.',
  'Every disguise offers a different way to fight. Each picture is worked out from the real skill numbers, so you can choose with open eyes.': 'Mỗi bộ hóa trang mang đến một cách chiến đấu khác nhau. Mỗi biểu đồ được tính từ chỉ số kỹ năng thật để bạn lựa chọn rõ ràng.',
};
