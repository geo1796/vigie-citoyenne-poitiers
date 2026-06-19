//go:generate go run go.uber.org/mock/mockgen -source=mailer.go -destination=mock_mailer.go -package=mailer

package mailer

import (
	"fmt"

	"gopkg.in/gomail.v2"
)

const from = "contact@vigie-citoyenne.fr"

type Mailer interface {
	Send(to, subject, body string) error
}

type mailer struct {
	*gomail.Dialer
	from string
}

func New(port int, host, address, password string) Mailer {
	return &mailer{
		Dialer: gomail.NewDialer(host, port, address, password),
		from:   from,
	}
}

func (m *mailer) Send(to, subject, body string) error {
	msg := gomail.NewMessage()

	msg.SetHeader("From", m.from)
	msg.SetHeader("To", to)
	msg.SetHeader("Subject", subject)
	msg.SetBody("text/plain; charset=UTF-8", body)

	err := m.DialAndSend(msg)
	if err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}

	return nil
}
