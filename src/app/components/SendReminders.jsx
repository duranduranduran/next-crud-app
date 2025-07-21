function SendRemindersButton() {
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSendReminders = async () => {
        setSending(true);
        setMessage(null);

        try {
            const res = await fetch('/api/send-reminders', {
                method: 'POST',
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Something went wrong.');
            }

            setMessage({ type: 'success', text: 'Reminders sent successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="mt-6">
            <button
                onClick={handleSendReminders}
                disabled={sending}
                className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
                    sending ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
                {sending ? 'Sending Reminders...' : 'Send Reminders'}
            </button>

            {message && (
                <p
                    className={`mt-2 ${
                        message.type === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}
                >
                    {message.text}
                </p>
            )}
        </div>
    );
}
export default SendRemindersButton