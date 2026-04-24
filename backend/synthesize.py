import pandas as pd
import random

modern_spam = [
    'URGENT: Your account has been suspended. Click here to verify your identity.',
    'You have won a $1000 gift card! Claim your prize now at this link.',
    'Limited time offer: Get 80% off on all items! Buy now!',
    'Work from home and earn $5000 a week. No experience needed. Apply today!',
    'Your package is waiting for delivery. Please pay the shipping fee here.',
    'Congratulations! You are the lucky winner of a brand new iPhone. Click to claim.',
    'Your Netflix subscription has expired. Update your payment details immediately.',
    'Important security alert: We detected unusual activity on your account. Log in to check.',
    'Earn crypto fast! Invest $10 and get $1000 in 24 hours. Guaranteed returns.',
    'Exclusive job offer: Remote assistant needed. High pay. Contact us now.',
    'Meet singles in your area tonight! Click here to chat.',
    'Lose weight fast with our miracle pill! 100% natural. Order now.',
    'Your bank account is locked. Verify your information to unlock it.',
    'Claim your free trial of our premium service. Sign up today!',
    'We have a special promotion just for you! Do not miss out.',
    'Internshala job offer. Check out our curated list for you. Remote Immediately Competitive salary No experience required'
]

modern_ham = [
    'Hi team, the meeting is scheduled for 10 AM tomorrow. Please review the attached document.',
    'Can you send me the latest report by EOD? Thanks.',
    'Are we still on for lunch today? Let me know.',
    'Please find attached the invoice for your recent purchase.',
    'Just checking in to see how the project is progressing.',
    'Reminder: doctor appointment at 3 PM on Thursday.',
    'Let us discuss the new strategy during our next call.',
    'Happy birthday! Hope you have a great day.',
    'I will be out of the office next week. Please contact Jane for any urgent matters.',
    'Thanks for the update. Let me know if you need any help.',
    'Do you have time for a quick chat later?',
    'The code has been deployed to production successfully.',
    'Can we reschedule our meeting to next week?',
    'I have reviewed your pull request and left some comments.',
    'Looking forward to seeing you at the conference.',
    'Reminder to fill this form if you have participated in sports. The link is given below again. The data related to the participation of students in sports and their achievements is essential for the institute. The form is made to collect the data (From 1st July 2025 to till date only) and the link for the same is as follows. https://forms.gle/xuPbEFWZAqnqZm1v9 Thank you.'
]

data = []
for _ in range(500):
    for spam_msg in modern_spam:
        data.append({'Message ID': random.randint(100000, 999999), 'Subject': 'Spam', 'Message': spam_msg, 'Spam/Ham': 'spam', 'Date': '2026-04-24'})
    for ham_msg in modern_ham:
        data.append({'Message ID': random.randint(100000, 999999), 'Subject': 'Ham', 'Message': ham_msg, 'Spam/Ham': 'ham', 'Date': '2026-04-24'})

new_df = pd.DataFrame(data)
df = pd.read_csv('backend/data/enron_spam_data.csv')
df = pd.concat([df, new_df], ignore_index=True)
df.to_csv('backend/data/enron_spam_data.csv', index=False)
print('Synthesized dataset appended. Total rows:', len(df))
