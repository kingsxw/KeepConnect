using Flurl.Http;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Text;
using System.Windows.Forms;
using static KeepConnect.EasyConnect;
namespace KeepConnect
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private async void GetAllStatus()
        {
            string status;
            EC.IsI = EasyConnect.IsInstalled(EC.ClientName, out string loc);
            EC.IsR = EasyConnect.IsRunning(EC.ClientName);
            EC.Location = loc;

            if (EC.IsI)
            {
                buttonInstall.Enabled = false;
                buttonInstall.BackColor = default;
                if (EC.IsR)
                {
                    buttonRun.Enabled = false;
                    buttonRun.BackColor = default;
                    EC.StatusCode = await EasyConnect.IsConnectedAsync();
                    switch (EC.StatusCode)
                    {
                        case 0:
                        case 1:
                        case 2:
                            while (EC.StatusCode == 0)
                            {
                                status = "EasyConnectδ���ӣ������ֶ��������ӣ���ִ�б���";
                                labelConnect.Text = status;
                                labelConnect.BackColor = Color.Magenta;
                                buttonKeep.Enabled = false;
                                buttonKeep.BackColor = default;
                                textBoxHost.Enabled = false;
                                numericUpDownPort.Enabled = false;
                                numericUpDownClcye.Enabled = false;
                                Thread.Sleep(1000);
                                EC.StatusCode = await EasyConnect.IsConnectedAsync();
                            }
                            while (EC.StatusCode == 2)
                            {
                                status = "EasyConnect���������У����Ժ�";
                                labelConnect.Text = status;
                                labelConnect.ForeColor = Color.DarkBlue;
                                buttonKeep.Enabled = false;
                                buttonKeep.BackColor = default;
                                textBoxHost.Enabled = false;
                                numericUpDownPort.Enabled = false;
                                numericUpDownClcye.Enabled = false;
                                Thread.Sleep(1000);
                                EC.StatusCode = await EasyConnect.IsConnectedAsync();
                            }
                            if (EC.StatusCode == 1)
                            {
                                status = "EasyConnect�����ӣ�����ִ�б���";
                                labelConnect.ForeColor = Color.BlueViolet;
                                buttonKeep.Enabled = true;
                                buttonKeep.BackColor = Color.LightGreen;
                                labelConnect.Text = status;
                                textBoxHost.Enabled = true;
                                numericUpDownPort.Enabled = true;
                                numericUpDownClcye.Enabled = true;
                            }
                            else
                            {
                                Thread.Sleep(1000);
                                GetAllStatus();
                            }
                            break;
                        default:
                            MessageBox.Show("״̬�쳣�������˳�");
                            Environment.Exit(0);
                            break;
                    }
                }
                else
                {
                    buttonRun.Enabled = true;
                    buttonRun.BackColor = Color.LightGreen;
                    buttonInstall.Enabled = false;
                    buttonInstall.BackColor = default;
                    buttonKeep.Enabled = false;
                    buttonKeep.BackColor = default;
                    textBoxHost.Enabled = false;
                    numericUpDownPort.Enabled = false;
                    numericUpDownClcye.Enabled = false;
                    status = "EasyConnect�ͻ���δ�����У��������а�ť����";
                    labelConnect.Text = status;
                    labelConnect.ForeColor = Color.DarkBlue;
                }
            }

            else
            {                
                buttonInstall.Enabled = true;
                buttonInstall.BackColor = Color.LightGreen;
                status = "EasyConnect�ͻ���δ��װ��������װ��ť���а�װ";
                labelConnect.Text = status;
            }
        }
        private void buttonRun_Click(object sender, EventArgs e)
        {
            //StartClient(EC.Location);
            Process process = new Process();
            process.StartInfo.FileName = EC.Location;
            process.Start();
            Thread.Sleep(1000);
            GetAllStatus();
        }

        private void buttonInstall_Click(object sender, EventArgs e)
        {

            MessageBox.Show("��Ҫ���ؿͻ��ˣ�������ɺ����ֶ���װ����װ��ɺ��ֶ�ˢ��״̬");
            using (Process p = new Process())
            {
                p.StartInfo.FileName = "https://gmvpn.sumpay.cn:18443/com/EasyConnectInstaller.exe";
                p.StartInfo.UseShellExecute = true;
                p.Start();
            }
            //string url = "https://gmvpn.sumpay.cn:18443/com/EasyConnectInstaller.exe";
            //Process.Start(url);
            //GetAllStatus();
        }

        private void labelConnect_Click(object sender, EventArgs e)
        {

        }

        private void buttonRefresh_Click(object sender, EventArgs e)
        {
            GetAllStatus();
        }


        private void buttonExit_Click(object sender, EventArgs e)
        {
            //Hide();
            //notifyIcon1.Visible = true;
            if (MessageBox.Show("ȷ���˳�����?", "ȷ���˳�", MessageBoxButtons.YesNo) == DialogResult.Yes)
            {
                Environment.Exit(0);
            }
        }

        private void Form1_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (MessageBox.Show("ȷ���˳�����?", "ȷ���˳�", MessageBoxButtons.YesNo) == DialogResult.No)
            {
                e.Cancel = true;
            }
            else
            {
                Environment.Exit(0);
            }
        }

        private void numericUpDownClcye_ValueChanged(object sender, EventArgs e)
        {
            EC.Cycle = (int)numericUpDownClcye.Value * 60;
        }

        private async void buttonKeep_Click(object sender, EventArgs e)
        {
            //if (buttonKeep.Text == "����")
            //{
            //labelConnect.Text = "���Բ���1";

            // Create a TcpClient instance

            buttonStop.Enabled = true;
            buttonStop.BackColor = Color.Salmon;
            buttonKeep.Enabled = false;
            buttonKeep.BackColor = default;
            Task t1 = Task.Factory.StartNew(async () =>
            {
                while (true)
                {
                    EC.Client = new TcpClient();
                    try
                    {
                        // Connect to the server
                        EC.Client.Connect(EC.Host, EC.Port);

                        // Set the KeepAlive option to make the connection persistent
                        //EC.Client.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.KeepAlive, true);
                        //EC.Client.Client.SetSocketOption(SocketOptionLevel.Tcp, SocketOptionName.TcpKeepAliveInterval, 3);
                        //EC.Client.Client.SetSocketOption(SocketOptionLevel.Tcp, SocketOptionName.TcpKeepAliveRetryCount, 5);
                        //EC.Client.Client.SetSocketOption(SocketOptionLevel.Tcp, SocketOptionName.TcpKeepAliveTime, EC.Cycle);
                        // Use the client to send and receive data
                        // ...

                        // Close the connection when you're done  
                        await Task.Delay(EC.Cycle * 1000);
                        EC.Client.Close();
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show("An error occurred: " + ex.Message);
                    }
                }
            });
            //Socket socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
            //socket.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.KeepAlive, true);
            //socket.SetSocketOption(SocketOptionLevel.Tcp, SocketOptionName.TcpKeepAliveInterval, EC.Cycle);
            //socket.Connect(EC.Host, EC.Port);

            //int keepAliveInterval = 60000;
            //byte[] keepAliveTime = BitConverter.GetBytes(keepAliveInterval);
            //byte[] keepAliveIntervalBytes = BitConverter.GetBytes(keepAliveInterval);
            //socket.IOControl(IOControlCode.KeepAliveValues, keepAliveTime, keepAliveIntervalBytes);
            //socket.Connect(IPAddress.Parse(EC.Host), EC.Port);

            //Ping pingSender = new Ping();
            //string data = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
            //byte[] buffer = Encoding.ASCII.GetBytes(data);
            //int timeout = 10000;
            //PingOptions options = new PingOptions(64, true);
            //PingReply reply = pingSender.Send(EC.Host, timeout, buffer, options);

            //using (HttpClient client = new HttpClient())
            //{
            //    HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Head, "http://172.16.128.80");
            //    HttpResponseMessage response = await client.SendAsync(request);

            //    // Check the response status code
            //    if (response.IsSuccessStatusCode)
            //    {
            //        // The HEAD request was successful
            //        MessageBox.Show("HEAD request successful");
            //    }
            //    else
            //    {
            //        // The HEAD request failed
            //        MessageBox.Show($"HEAD request failed with status code: {response.StatusCode}");
            //    }
            //}
            labelConnect.Text = "EasyConnect VPN���ӱ�����...";
            labelConnect.ForeColor = Color.Green;

            //}
            //else if (buttonKeep.Text == "ֹͣ")
            //{
            //    try
            //    {
            //        Socket.Close();
            //    }
            //    catch (Exception)
            //    {

            //        throw;
            //    }
            //    //   EC.IsLoop=false;
            //    buttonKeep.Text = "����";
            //}
            //if (buttonKeep.Text == "����")
            //{
            //////EC.IsLoop = true;
            //////labelConnect.Text = "���Բ���";
            ////////buttonKeep.Text = "ֹͣ";
            ////////Socket socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
            //////int count = 0;
            //////while (EC.IsLoop)
            //////{
            //////    count++;
            //////    labelConnect.Text = $"{DateTime.Now.ToString()} ����ɵ�{count.ToString()}��Keepalive����";
            //////    TcpKeep(EC.Host, EC.Port);
            //////}

            //}
            //else if (buttonKeep.Text == "ֹͣ")
            //{
            //    EC.IsLoop=false;
            //    buttonKeep.Text = "����";
            //}
        }

        private void labelUrl_Click(object sender, EventArgs e)
        {

        }

        private void numericUpDownPort_ValueChanged(object sender, EventArgs e)
        {
            EC.Port = (int)numericUpDownPort.Value;
        }

        private void textBoxHost_TextChanged(object sender, EventArgs e)
        {
            EC.Host = textBoxHost.Text;
        }

        private void labelCycle_Click(object sender, EventArgs e)
        {

        }

        private void notifyIcon1_MouseDoubleClick(object sender, MouseEventArgs e)
        {
            //if (this.WindowState == FormWindowState.Minimized)
            //{
            //    this.ShowInTaskbar = true;
            //    this.WindowState = FormWindowState.Normal;
            //    notifyIcon1.Visible = false;
            //}

            if (!Visible)
            {
                Show();
                WindowState = FormWindowState.Normal;
                notifyIcon1.Visible = false;
            }

        }

        private void Form1_Load(object sender, EventArgs e)
        {
            EC.Cycle = (int)numericUpDownClcye.Value * 60;
            EC.Host = textBoxHost.Text;
            EC.Port = (int)numericUpDownPort.Value;
            GetAllStatus();
            var menuItemOpen = new ToolStripMenuItem
            {
                AutoToolTip = true,
                Text = "��",
                ToolTipText = "�򿪳���"
            };
            menuItemOpen.Click += (sender, args) =>
            {
                Show();
                WindowState = FormWindowState.Normal;
                notifyIcon1.Visible = false;
            };
            var menuItemQuit = new ToolStripMenuItem
            {
                AutoToolTip = true,
                Text = "�˳�",
                ToolTipText = "�˳�����"
            };
            menuItemQuit.Click += (sender, args) => Application.Exit();
            contextMenuStrip1.Items.Add(menuItemOpen);
            contextMenuStrip1.Items.Add(menuItemQuit);
        }

        private void Form1_Resize(object sender, EventArgs e)
        {
            if (WindowState == FormWindowState.Minimized)
            {
                Hide();
                notifyIcon1.Visible = true;
            }
        }

        private void buttonStop_Click(object sender, EventArgs e)
        {
            EC.Client.Close();
            buttonStop.Enabled = false;
            buttonStop.BackColor = default;
            buttonKeep.Enabled = true;
            buttonKeep.BackColor = Color.LightGreen;
            labelConnect.Text = "EasyConnect VPN���ӱ�������ֹ...";
            labelConnect.ForeColor = default;
        }

        private void contextMenuStrip1_Opening(object sender, System.ComponentModel.CancelEventArgs e)
        {

        }

    }
}
