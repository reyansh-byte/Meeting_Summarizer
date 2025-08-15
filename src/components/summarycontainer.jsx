import { Card, Upload, message, Typography, Input, Select, Button, Row, Col } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useState } from "react";
import axios from "axios";

const { Dragger } = Upload;
const { Paragraph } = Typography;
const { TextArea } = Input;

function SummaryContainer() {
  const [context, setContext] = useState("");
  const [whisperModel, setWhisperModel] = useState("small");
  const [summaryModel, setSummaryModel] = useState("llama3.2:latest");
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState("");
  const [transcript, setTranscript] = useState(""); // NEW: Show transcript too

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
    formData.append("whisperModel", whisperModel);
    formData.append("summaryModel", summaryModel);

    try {
      message.loading({ content: "Processing...", key: "processing" });

      const res = await axios.post("http://localhost:5000/api/summarize", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Expecting backend to send { transcript: "...", summary: "..." }
      setTranscript(res.data.transcript || "");
      setSummary(res.data.summary || "");

      message.success({ content: "Summary generated!", key: "processing" });
    } catch (error) {
      console.error(error);
      message.error({ content: "Error processing file", key: "processing" });
    }
  };

  const cardStyle = {
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    height: "100%",
  };

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]}>
        {/* Summary */}
        <Col xs={24} md={12}>
          <Card title="Meeting Summary" style={cardStyle}>
            <Paragraph>{summary || "Your meeting summary will appear here."}</Paragraph>
          </Card>
        </Col>

        {/* Upload */}
        <Col xs={24} md={12}>
          <Card title="Upload Meeting Audio/Video" style={cardStyle}>
            <Dragger {...props}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file here</p>
              <p className="ant-upload-hint">Audio and video formats only</p>
            </Dragger>
          </Card>
        </Col>

        {/* Transcript */}
        <Col xs={24} md={12}>
          <Card title="Transcript" style={cardStyle}>
            <Paragraph>{transcript || "Transcript will appear here."}</Paragraph>
          </Card>
        </Col>

        {/* Context */}
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

        {/* Model Selection */}
        <Col xs={24} md={12}>
          <Card title="Model Selection" style={cardStyle}>
            <Select
              value={whisperModel}
              onChange={setWhisperModel}
              options={[
                { value: "tiny", label: "tiny" },
                { value: "small", label: "small" },
                { value: "medium", label: "medium" },
                { value: "large", label: "large" },
              ]}
              style={{ marginBottom: 8, width: "100%" }}
            />
            <Select
              value={summaryModel}
              onChange={setSummaryModel}
              options={[
                { value: "llama3.2:latest", label: "llama3.2:latest" },
                { value: "gpt-4o", label: "gpt-4o" },
                { value: "mistral", label: "mistral" },
              ]}
              style={{ marginBottom: 8, width: "100%" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                danger
                size="small"
                onClick={() => {
                  setFile(null);
                  setSummary("");
                  setTranscript("");
                }}
              >
                Clear
              </Button>
              <Button type="primary" size="small" onClick={handleSubmit}>
                Submit
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default SummaryContainer;
