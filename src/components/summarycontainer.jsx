import {
  Card,
  Upload,
  message,
  Typography,
  Input,
  Button,
  Row,
  Col,
  Spin,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useState } from "react";
import axios from "axios";

const { Dragger } = Upload;
const { Paragraph, Text } = Typography;
const { TextArea } = Input;

function SummaryContainer() {
  const [context, setContext] = useState("");
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState("");
  const [transcript, setTranscript] = useState("");
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(false);

  const props = {
    name: "file",
    multiple: false,
    accept: "audio/*,video/*",
    beforeUpload: (file) => {
      setFile(file);
      return false; // prevent auto upload
    },
  };

  const handleSubmit = async () => {
    if (!file) {
      return message.error("Please upload a file first.");
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("context", context);

    try {
      setLoading(true);
      setSummary("");
      setTranscript("");
      setMetadata({});
      message.loading({ content: "Processing...", key: "processing" });

      const res = await axios.post("http://localhost:5000/upload", formData);

      setTranscript(res.data.transcription || "No transcription available.");
      setSummary(res.data.summary || "No summary generated.");
      setMetadata(res.data.metadata || {});

      message.success({ content: "Summary generated!", key: "processing" });
    } catch (err) {
      console.error("Upload error:", err);
      setSummary("Error: Could not generate summary.");
      setTranscript("Error: Could not transcribe audio.");
      setMetadata({});
      message.error({ content: "Error processing file", key: "processing" });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setSummary("");
    setTranscript("");
    setMetadata({});
    setContext("");
  };

  const cardStyle = {
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  };

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Meeting Summary" style={cardStyle}>
            {loading ? (
              <Spin />
            ) : (
              <>
                <Paragraph>{summary || "Your meeting summary will appear here."}</Paragraph>
                {metadata.summaryMethod && (
                  <Text type="secondary">
                    Method: {metadata.summaryMethod}{" "}
                    {metadata.modelUsed ? ` | Model: ${metadata.modelUsed}` : ""}
                  </Text>
                )}
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Upload Audio/Video" style={cardStyle}>
            <Dragger {...props}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file here</p>
              <p className="ant-upload-hint">Audio/video formats only</p>
            </Dragger>
            {file && <Text type="secondary">Selected: {file.name}</Text>}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Transcript" style={cardStyle}>
            {loading ? (
              <Spin />
            ) : (
              <Paragraph>
                {transcript || "Transcript will appear here."}
              </Paragraph>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Context (optional)" style={cardStyle}>
            <TextArea
              placeholder="Provide additional context"
              autoSize={{ minRows: 2, maxRows: 3 }}
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Actions" style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button danger size="small" onClick={handleClear}>
                Clear
              </Button>
              <Button
                type="primary"
                size="small"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Processing..." : "Submit"}
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default SummaryContainer;
