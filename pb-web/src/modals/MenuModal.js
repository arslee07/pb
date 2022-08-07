import { Modal, Form } from "react-bootstrap"
import useLocalStorage from "../hooks/UseLocalStorage"

export default function MenuModal(props) {
    const [token, setToken] = useLocalStorage("token");

    return <Modal show={props.show} onHide={props.onHide}>
        <Modal.Header closeButton >
            <Modal.Title>Menu</Modal.Title>
        </Modal.Header >
        <Modal.Body>
            <Form.Group>
                <Form.Label>Enter your token here:</Form.Label>
                <Form.Control type="password" value={token} onChange={(e) => setToken(e.target.value)}></Form.Control>
                <Form.Text className="text-muted" >
                    If you don't have a token, get it using the <a href="https://t.me/pb_auth_bot" className="link-secondary">Telegram bot</a>
                </Form.Text>
            </Form.Group>
            <hr className="my-3" />
            <span className="text-secondary">made with {"<3"} by <a href="https://arslee.me/" className="link-secondary">arslee</a> •</span> <a href="https://github.com/arslee07/pb" className="link-secondary">source code</a>{ }
        </Modal.Body>
    </Modal >
}